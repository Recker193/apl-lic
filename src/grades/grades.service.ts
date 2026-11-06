import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GradeStatus,
  GradeType,
  NotificationType,
  TermStatus,
} from '@prisma/client';
import { AccessService } from '../common/access/access.service';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly notifications: NotificationsService,
  ) {}

  async listGroupGrades(
    user: AuthenticatedUser,
    groupId: string,
    termId?: string,
  ) {
    await this.access.getGroupAccess(user, groupId);

    const where: any = {
      groupId,
      schoolId: user.schoolId,
      status: GradeStatus.ACTIVE,
    };

    if (termId) {
      where.termId = termId;
    }

    const grades = await this.prisma.gradeEntry.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { gradedAt: 'desc' },
    });

    // Students only see their own grades
    if (user.role === 'STUDENT') {
      return grades.filter((g) => g.studentId === user.id);
    }

    return grades;
  }

  async listStudentGrades(
    user: AuthenticatedUser,
    studentId: string,
    termId?: string,
  ) {
    // Student can only see their own grades
    if (user.role === 'STUDENT' && user.id !== studentId) {
      throw new ForbiddenException();
    }

    const where: any = {
      studentId,
      schoolId: user.schoolId,
      status: GradeStatus.ACTIVE,
    };

    if (termId) {
      where.termId = termId;
    }

    const grades = await this.prisma.gradeEntry.findMany({
      where,
      include: {
        group: {
          include: {
            subject: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { gradedAt: 'desc' },
    });

    // Non-students need to verify they have access to the student's grades
    if (user.role !== 'STUDENT') {
      for (const grade of grades) {
        await this.access.getGroupAccess(user, grade.groupId);
      }
    }

    return grades;
  }

  async createGrade(
    user: AuthenticatedUser,
    groupId: string,
    dto: {
      studentId: string;
      type: GradeType;
      value: number;
      gradedAt: string;
      comment?: string;
    },
  ) {
    await this.access.assertGroupTeacher(user, groupId);

    // Verify student is a member of the group
    const membership = await this.prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: dto.studentId,
        },
      },
    });

    if (!membership) {
      throw new BadRequestException('Student is not a member of this group');
    }

    // Get or find the appropriate term based on gradedAt date
    const gradedAt = new Date(dto.gradedAt);
    const term = await this.prisma.term.findFirst({
      where: {
        schoolId: user.schoolId,
        status: TermStatus.OPEN,
        startsAt: { lte: gradedAt },
        endsAt: { gte: gradedAt },
      },
    });

    if (!term) {
      throw new BadRequestException('No open term found for the given date');
    }

    const grade = await this.prisma.gradeEntry.create({
      data: {
        schoolId: user.schoolId,
        termId: term.id,
        groupId,
        studentId: dto.studentId,
        teacherId: user.id,
        type: dto.type,
        value: dto.value,
        gradedAt,
        comment: dto.comment,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Notify the student
    await this.notifications.notifyUsers({
      userIds: [dto.studentId],
      type: NotificationType.GRADE_ADDED,
      title: 'Notă nouă',
      message: `Ai primit nota ${dto.value}`,
      resourceType: 'GradeEntry',
      resourceId: grade.id,
      dedupeKey: `grade-added:${grade.id}:${dto.value}`,
    });

    return grade;
  }

  async updateGrade(
    user: AuthenticatedUser,
    gradeId: string,
    dto: { value: number; reason: string },
  ) {
    const grade = await this.prisma.gradeEntry.findFirst({
      where: { id: gradeId, schoolId: user.schoolId },
    });

    if (!grade) {
      throw new NotFoundException();
    }

    // Check if term is closed
    const term = await this.prisma.term.findUnique({
      where: { id: grade.termId },
    });

    if (term?.status === TermStatus.CLOSED) {
      // Only admin can correct after term is closed
      if (user.role !== 'ADMIN') {
        throw new ForbiddenException('Term is closed');
      }
    } else {
      // Teacher can only correct their own grades
      await this.access.assertGroupTeacher(user, grade.groupId);
    }

    // Check for concurrent modification
    if (grade.value !== dto.value) {
      const updated = await this.prisma.$transaction(async (tx) => {
        // Check version again within transaction
        const current = await tx.gradeEntry.findUnique({
          where: { id: gradeId },
        });

        if (!current || current.version !== grade.version) {
          throw new ConflictException('Grade was modified by another user');
        }

        // Create revision
        await tx.gradeRevision.create({
          data: {
            gradeId,
            actorId: user.id,
            previousValue: grade.value,
            newValue: dto.value,
            reason: dto.reason,
          },
        });

        // Update grade
        return tx.gradeEntry.update({
          where: { id: gradeId },
          data: {
            value: dto.value,
            version: { increment: 1 },
          },
        });
      });

      // Notify student of change
      await this.notifications.notifyUsers({
        userIds: [grade.studentId],
        type: NotificationType.GRADE_CHANGED,
        title: 'Notă modificată',
        message: `Nota ta a fost modificată la ${dto.value}`,
        resourceType: 'GradeEntry',
        resourceId: gradeId,
        dedupeKey: `grade-changed:${gradeId}:${dto.value}`,
      });

      return updated;
    }

    return grade;
  }

  async voidGrade(
    user: AuthenticatedUser,
    gradeId: string,
    dto: { reason: string },
  ) {
    const grade = await this.prisma.gradeEntry.findFirst({
      where: { id: gradeId, schoolId: user.schoolId },
    });

    if (!grade) {
      throw new NotFoundException();
    }

    // Check if term is closed
    const term = await this.prisma.term.findUnique({
      where: { id: grade.termId },
    });

    if (term?.status === TermStatus.CLOSED) {
      if (user.role !== 'ADMIN') {
        throw new ForbiddenException('Term is closed');
      }
    } else {
      await this.access.assertGroupTeacher(user, grade.groupId);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Create revision
      await tx.gradeRevision.create({
        data: {
          gradeId,
          actorId: user.id,
          previousStatus: grade.status,
          newStatus: GradeStatus.VOIDED,
          reason: dto.reason,
        },
      });

      // Void the grade
      return tx.gradeEntry.update({
        where: { id: gradeId },
        data: {
          status: GradeStatus.VOIDED,
          voidedReason: dto.reason,
          version: { increment: 1 },
        },
      });
    });

    return updated;
  }

  async getGradeHistory(user: AuthenticatedUser, gradeId: string) {
    const grade = await this.prisma.gradeEntry.findFirst({
      where: { id: gradeId, schoolId: user.schoolId },
    });

    if (!grade) {
      throw new NotFoundException();
    }

    // Only teacher of the group or admin can see history
    if (user.role !== 'ADMIN') {
      await this.access.assertGroupTeacher(user, grade.groupId);
    }

    return this.prisma.gradeRevision.findMany({
      where: { gradeId },
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
