import { Injectable } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async range(
    user: AuthenticatedUser,
    from: Date,
    to: Date,
    subjectId?: string,
  ) {
    const groupFilter =
      user.role === 'ADMIN'
        ? { schoolId: user.schoolId, ...(subjectId ? { subjectId } : {}) }
        : {
            schoolId: user.schoolId,
            ...(subjectId ? { subjectId } : {}),
            OR: [
              { teacherId: user.id },
              { memberships: { some: { userId: user.id } } },
            ],
          };

    const groups = await this.prisma.subjectGroup.findMany({
      where: groupFilter,
      select: { id: true },
    });
    const groupIds = groups.map((g) => g.id);

    const [assignments, exams, events] = await Promise.all([
      this.prisma.assignment.findMany({
        where: {
          schoolId: user.schoolId,
          groupId: { in: groupIds },
          status: ContentStatus.PUBLISHED,
          dueAt: { gte: from, lte: to },
        },
        orderBy: { dueAt: 'asc' },
      }),
      this.prisma.exam.findMany({
        where: {
          schoolId: user.schoolId,
          groupId: { in: groupIds },
          status: { not: ContentStatus.ARCHIVED },
          scheduledAt: { gte: from, lte: to },
        },
        orderBy: { scheduledAt: 'asc' },
      }),
      this.prisma.schoolEvent.findMany({
        where: {
          schoolId: user.schoolId,
          startsAt: { lte: to },
          endsAt: { gte: from },
        },
        orderBy: { startsAt: 'asc' },
      }),
    ]);

    return { assignments, exams, events };
  }
}
