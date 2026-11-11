import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AbsenceStatus, NotificationType, TermStatus } from '@prisma/client';
import { AccessService } from '../common/access/access.service';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AbsencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly notifications: NotificationsService,
  ) {}

  async listClassAbsences(
    user: AuthenticatedUser,
    classId: string,
    from?: string,
    to?: string,
  ) {
    // Verify user has access to the class
    const classMembership = await this.prisma.classMembership.findFirst({
      where: {
        classId,
        studentId: user.id,
      },
    });

    if (!classMembership && user.role !== 'ADMIN') {
      // Check if user is a homeroom teacher for this class
      const homeroom = await this.prisma.homeroomAssignment.findFirst({
        where: {
          classId,
          teacherId: user.id,
        },
      });

      if (!homeroom) {
        throw new ForbiddenException();
      }
    }

    const where: any = {
      schoolId: user.schoolId,
    };

    if (from && to) {
      where.date = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    // Get all students in the class
    const classMembers = await this.prisma.classMembership.findMany({
      where: { classId },
      select: { studentId: true },
    });

    const studentIds = classMembers.map((m) => m.studentId);
    where.studentId = { in: studentIds };

    const absences = await this.prisma.absence.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        group: {
          include: {
            subject: true,
          },
        },
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        excusedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return absences;
  }

  async listStudentAbsences(
    user: AuthenticatedUser,
    studentId: string,
    from?: string,
    to?: string,
  ) {
    // Student can only see their own absences
    if (user.role === 'STUDENT' && user.id !== studentId) {
      throw new ForbiddenException();
    }

    const where: any = {
      studentId,
      schoolId: user.schoolId,
    };

    if (from && to) {
      where.date = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const absences = await this.prisma.absence.findMany({
      where,
      include: {
        group: {
          include: {
            subject: true,
          },
        },
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        excusedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Non-students need to verify they have access
    if (user.role !== 'STUDENT') {
      for (const absence of absences) {
        if (absence.groupId) {
          await this.access.getGroupAccess(user, absence.groupId);
        }
      }
    }

    return absences;
  }

  async createAbsence(
    user: AuthenticatedUser,
    dto: {
      studentId: string;
      date: string;
      groupId?: string;
    },
  ) {
    if (dto.groupId) {
      await this.access.assertGroupTeacher(user, dto.groupId);
    } else if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can record absences without a group');
    }

    // Verify student exists
    const student = await this.prisma.user.findFirst({
      where: { id: dto.studentId, schoolId: user.schoolId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Find the appropriate term
    const date = new Date(dto.date);
    let term = await this.prisma.term.findFirst({
      where: {
        schoolId: user.schoolId,
        status: TermStatus.OPEN,
        startsAt: { lte: date },
        endsAt: { gte: date },
      },
    });

    if (!term) {
      term = await this.prisma.term.findFirst({
        where: {
          schoolId: user.schoolId,
          status: TermStatus.OPEN,
        },
      });
      if (!term) {
        const now = new Date();
        term = await this.prisma.term.create({
          data: {
            schoolId: user.schoolId,
            schoolYear: `${now.getFullYear()}-${now.getFullYear() + 1}`,
            number: 1,
            status: TermStatus.OPEN,
            startsAt: new Date(now.getFullYear(), 8, 1),
            endsAt: new Date(now.getFullYear() + 1, 5, 30),
          },
        });
      }
    }

    // Check for duplicate absence
    const existing = await this.prisma.absence.findFirst({
      where: {
        studentId: dto.studentId,
        groupId: dto.groupId || null,
        date,
      },
    });

    if (existing) {
      throw new BadRequestException('Absence already recorded for this date and group');
    }

    const absence = await this.prisma.absence.create({
      data: {
        schoolId: user.schoolId,
        termId: term.id,
        studentId: dto.studentId,
        groupId: dto.groupId,
        date,
        recordedById: user.id,
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
      type: NotificationType.ABSENCE_RECORDED,
      title: 'Absență înregistrată',
      message: 'Ai o absență nouă înregistrată',
      resourceType: 'Absence',
      resourceId: absence.id,
      dedupeKey: `absence-recorded:${absence.id}`,
    });

    return absence;
  }

  async excuseAbsence(
    user: AuthenticatedUser,
    absenceId: string,
    dto: { reason: string },
  ) {
    const absence = await this.prisma.absence.findFirst({
      where: { id: absenceId, schoolId: user.schoolId },
      include: {
        student: {
          include: {
            classMemberships: true,
          },
        },
      },
    });

    if (!absence) {
      throw new NotFoundException();
    }

    // Only homeroom teacher or admin can excuse absences
    if (user.role !== 'ADMIN') {
      // Check if user is homeroom teacher for the student's class
      const classMembership = absence.student.classMemberships[0];
      if (!classMembership) {
        throw new ForbiddenException();
      }

      const homeroom = await this.prisma.homeroomAssignment.findFirst({
        where: {
          classId: classMembership.classId,
          teacherId: user.id,
        },
      });

      if (!homeroom) {
        throw new ForbiddenException();
      }
    }

    if (absence.status === AbsenceStatus.EXCUSED) {
      throw new BadRequestException('Absence is already excused');
    }

    const updated = await this.prisma.absence.update({
      where: { id: absenceId },
      data: {
        status: AbsenceStatus.EXCUSED,
        excuseReason: dto.reason,
        excusedById: user.id,
      },
    });

    return updated;
  }

  async getAbsenceTotals(
    user: AuthenticatedUser,
    studentId: string,
    termId: string,
  ) {
    // Student can only see their own totals
    if (user.role === 'STUDENT' && user.id !== studentId) {
      throw new ForbiddenException();
    }

    const term = await this.prisma.term.findFirst({
      where: { id: termId, schoolId: user.schoolId },
    });

    if (!term) {
      throw new NotFoundException();
    }

    const totals = await this.prisma.absence.groupBy({
      by: ['status'],
      where: {
        studentId,
        termId,
        schoolId: user.schoolId,
      },
      _count: true,
    });

    return {
      total: totals.reduce((sum, t) => sum + t._count, 0),
      unexcused:
        totals.find((t) => t.status === AbsenceStatus.UNEXCUSED)?._count || 0,
      excused:
        totals.find((t) => t.status === AbsenceStatus.EXCUSED)?._count || 0,
    };
  }
}
