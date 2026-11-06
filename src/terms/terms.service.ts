import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, TermStatus } from '@prisma/client';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TermsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(user: AuthenticatedUser) {
    return this.prisma.term.findMany({
      where: { schoolId: user.schoolId },
      orderBy: [{ schoolYear: 'desc' }, { number: 'asc' }],
    });
  }

  async create(
    user: AuthenticatedUser,
    dto: {
      schoolYear: string;
      number: number;
      startsAt: string;
      endsAt: string;
    },
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException();
    }

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException('Invalid dates');
    }

    if (startsAt >= endsAt) {
      throw new BadRequestException('startsAt must be before endsAt');
    }

    // Check for duplicate
    const existing = await this.prisma.term.findUnique({
      where: {
        schoolId_schoolYear_number: {
          schoolId: user.schoolId,
          schoolYear: dto.schoolYear,
          number: dto.number,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Term already exists');
    }

    return this.prisma.term.create({
      data: {
        schoolId: user.schoolId,
        schoolYear: dto.schoolYear,
        number: dto.number,
        startsAt,
        endsAt,
        status: TermStatus.OPEN,
      },
    });
  }

  async close(user: AuthenticatedUser, termId: string) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException();
    }

    const term = await this.prisma.term.findFirst({
      where: { id: termId, schoolId: user.schoolId },
    });

    if (!term) {
      throw new NotFoundException();
    }

    if (term.status === TermStatus.CLOSED) {
      throw new BadRequestException('Term is already closed');
    }

    // Get all students before closing
    const students = await this.prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'STUDENT',
      },
      select: { id: true },
    });

    const userIds = students.map((s) => s.id);

    // Close the term
    const closedTerm = await this.prisma.term.update({
      where: { id: termId },
      data: { status: TermStatus.CLOSED },
    });

    // Notify all students
    await this.notifications.notifyUsers({
      userIds,
      type: NotificationType.TERM_CLOSED,
      title: 'Semestru închis',
      message: `Semestrul ${term.number} pentru anul ${term.schoolYear} a fost închis`,
      resourceType: 'Term',
      resourceId: termId,
      dedupeKey: `term-closed:${termId}`,
    });

    return closedTerm;
  }
}
