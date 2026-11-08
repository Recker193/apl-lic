import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimetableEntryDto } from './timetable.dto';

@Injectable()
export class TimetableService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyTimetable(user: AuthenticatedUser) {
    if (user.role === UserRole.STUDENT) {
      const membership = await this.prisma.classMembership.findFirst({
        where: { studentId: user.id },
      });
      if (!membership) return [];
      return this.getClassTimetable(user, membership.classId);
    }

    if (user.role === UserRole.TEACHER) {
      return this.prisma.timetableEntry.findMany({
        where: {
          schoolId: user.schoolId,
          teacherId: user.id,
        },
        include: {
          class: { select: { id: true, name: true, schoolYear: true } },
          subject: { select: { id: true, name: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
      });
    }

    return this.prisma.timetableEntry.findMany({
      where: { schoolId: user.schoolId },
      include: {
        class: { select: { id: true, name: true, schoolYear: true } },
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
    });
  }

  async getClassTimetable(user: AuthenticatedUser, classId: string) {
    const schoolClass = await this.prisma.schoolClass.findFirst({
      where: { id: classId, schoolId: user.schoolId },
    });
    if (!schoolClass) {
      throw new NotFoundException('Class not found');
    }

    return this.prisma.timetableEntry.findMany({
      where: {
        schoolId: user.schoolId,
        classId,
      },
      include: {
        class: { select: { id: true, name: true, schoolYear: true } },
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
    });
  }

  async createEntry(user: AuthenticatedUser, dto: CreateTimetableEntryDto) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can configure the timetable');
    }

    const schoolClass = await this.prisma.schoolClass.findFirst({
      where: { id: dto.classId, schoolId: user.schoolId },
    });
    if (!schoolClass) throw new NotFoundException('Class not found');

    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, schoolId: user.schoolId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    const teacher = await this.prisma.user.findFirst({
      where: { id: dto.teacherId, schoolId: user.schoolId, role: UserRole.TEACHER },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const teacherConflict = await this.prisma.timetableEntry.findFirst({
      where: {
        schoolId: user.schoolId,
        teacherId: dto.teacherId,
        dayOfWeek: dto.dayOfWeek,
        period: dto.period,
      },
    });
    if (teacherConflict) {
      throw new BadRequestException('Teacher is already assigned to another class during this period');
    }

    return this.prisma.timetableEntry.upsert({
      where: {
        classId_dayOfWeek_period: {
          classId: dto.classId,
          dayOfWeek: dto.dayOfWeek,
          period: dto.period,
        },
      },
      update: {
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        startTime: dto.startTime,
        endTime: dto.endTime,
        room: dto.room,
      },
      create: {
        schoolId: user.schoolId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        dayOfWeek: dto.dayOfWeek,
        period: dto.period,
        startTime: dto.startTime,
        endTime: dto.endTime,
        room: dto.room,
      },
      include: {
        class: { select: { id: true, name: true, schoolYear: true } },
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async deleteEntry(user: AuthenticatedUser, id: string) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete timetable entries');
    }

    const entry = await this.prisma.timetableEntry.findFirst({
      where: { id, schoolId: user.schoolId },
    });
    if (!entry) throw new NotFoundException('Timetable entry not found');

    await this.prisma.timetableEntry.delete({ where: { id } });
    return { success: true };
  }
}

