import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TermStatus } from '@prisma/client';
import { AccessService } from '../common/access/access.service';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HomeroomService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async createAssignment(
    user: AuthenticatedUser,
    dto: {
      classId: string;
      teacherId: string;
      schoolYear: string;
    },
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException();
    }

    // Verify class exists
    const classData = await this.prisma.schoolClass.findFirst({
      where: { id: dto.classId, schoolId: user.schoolId },
    });

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    // Verify teacher exists
    const teacher = await this.prisma.user.findFirst({
      where: { id: dto.teacherId, schoolId: user.schoolId, role: 'TEACHER' },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Check for existing assignment
    const existing = await this.prisma.homeroomAssignment.findUnique({
      where: {
        classId_schoolYear: {
          classId: dto.classId,
          schoolYear: dto.schoolYear,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Homeroom assignment already exists for this class and year');
    }

    return this.prisma.homeroomAssignment.create({
      data: {
        schoolId: user.schoolId,
        classId: dto.classId,
        teacherId: dto.teacherId,
        schoolYear: dto.schoolYear,
      },
      include: {
        class: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getClassSummary(
    user: AuthenticatedUser,
    classId: string,
    termId?: string,
  ) {
    // Verify user is homeroom teacher or admin
    if (user.role !== 'ADMIN') {
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

    // Get all students in the class
    const classMembers = await this.prisma.classMembership.findMany({
      where: { classId },
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

    const studentIds = classMembers.map((m) => m.studentId);

    // Get grades for each student if termId is provided
    const gradesByStudent = new Map<string, any[]>();
    const absencesByStudent = new Map<string, any[]>();
    const conductGradesByStudent = new Map<string, any>();

    if (termId) {
      const grades = await this.prisma.gradeEntry.findMany({
        where: {
          studentId: { in: studentIds },
          termId,
          schoolId: user.schoolId,
          status: 'ACTIVE',
        },
        include: {
          group: {
            include: {
              subject: true,
            },
          },
        },
      });

      grades.forEach((g) => {
        if (!gradesByStudent.has(g.studentId)) {
          gradesByStudent.set(g.studentId, []);
        }
        gradesByStudent.get(g.studentId)!.push(g);
      });

      const absences = await this.prisma.absence.findMany({
        where: {
          studentId: { in: studentIds },
          termId,
          schoolId: user.schoolId,
        },
      });

      absences.forEach((a) => {
        if (!absencesByStudent.has(a.studentId)) {
          absencesByStudent.set(a.studentId, []);
        }
        absencesByStudent.get(a.studentId)!.push(a);
      });

      const conductGrades = await this.prisma.conductGrade.findMany({
        where: {
          studentId: { in: studentIds },
          termId,
          schoolId: user.schoolId },
      });

      conductGrades.forEach((c) => {
        conductGradesByStudent.set(c.studentId, c);
      });
    }

    return classMembers.map((m) => ({
      student: m.student,
      grades: gradesByStudent.get(m.studentId) || [],
      absences: absencesByStudent.get(m.studentId) || [],
      conductGrade: conductGradesByStudent.get(m.studentId) || null,
    }));
  }

  async setConductGrade(
    user: AuthenticatedUser,
    classId: string,
    studentId: string,
    dto: { value: number },
    termId?: string,
  ) {
    // Verify user is homeroom teacher or admin
    if (user.role !== 'ADMIN') {
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

    // Verify student is in the class
    const membership = await this.prisma.classMembership.findFirst({
      where: {
        classId,
        studentId,
      },
    });

    if (!membership) {
      throw new NotFoundException('Student is not in this class');
    }

    // If termId not provided, find current open term
    let termIdToUse = termId;
    if (!termIdToUse) {
      const term = await this.prisma.term.findFirst({
        where: {
          schoolId: user.schoolId,
          status: TermStatus.OPEN,
        },
      });

      if (!term) {
        throw new BadRequestException('No open term found');
      }
      termIdToUse = term.id;
    }

    // Check if term is closed
    const term = await this.prisma.term.findUnique({
      where: { id: termIdToUse },
    });

    if (term?.status === TermStatus.CLOSED) {
      throw new BadRequestException('Term is closed');
    }

    return this.prisma.conductGrade.upsert({
      where: {
        termId_studentId: {
          termId: termIdToUse,
          studentId,
        },
      },
      update: {
        value: dto.value,
        setById: user.id,
      },
      create: {
        schoolId: user.schoolId,
        termId: termIdToUse,
        studentId,
        value: dto.value,
        setById: user.id,
      },
    });
  }

  async listAssignments(user: AuthenticatedUser) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException();
    }

    return this.prisma.homeroomAssignment.findMany({
      where: { schoolId: user.schoolId },
      include: {
        class: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { schoolYear: 'desc' },
    });
  }
}
