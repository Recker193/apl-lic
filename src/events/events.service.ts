import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  list(user: AuthenticatedUser) {
    return this.prisma.schoolEvent.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { startsAt: 'asc' },
    });
  }

  async get(user: AuthenticatedUser, id: string) {
    const item = await this.prisma.schoolEvent.findFirst({
      where: { id, schoolId: user.schoolId },
    });
    if (!item) throw new NotFoundException();
    return item;
  }

  async create(
    user: AuthenticatedUser,
    input: {
      title: string;
      description: string;
      startsAt: string;
      endsAt: string;
    },
  ) {
    const item = await this.prisma.schoolEvent.create({
      data: {
        schoolId: user.schoolId,
        authorId: user.id,
        title: input.title,
        description: input.description,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
      },
    });
    const students = await this.prisma.user.findMany({
      where: { schoolId: user.schoolId, role: 'STUDENT', isActive: true },
      select: { id: true },
    });
    await this.notifications.notifyUsers({
      userIds: students.map((s) => s.id),
      type: NotificationType.SCHOOL_EVENT_CREATED,
      title: 'School event',
      message: item.title,
      resourceType: 'SchoolEvent',
      resourceId: item.id,
      dedupeKey: `school-event-created:${item.id}`,
    });
    return item;
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    input: {
      title?: string;
      description?: string;
      startsAt?: string;
      endsAt?: string;
    },
  ) {
    await this.get(user, id);
    return this.prisma.schoolEvent.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
      },
    });
  }
}
