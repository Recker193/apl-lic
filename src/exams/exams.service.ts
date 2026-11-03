import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, NotificationType } from '@prisma/client';
import { AccessService } from '../common/access/access.service';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(user: AuthenticatedUser, groupId: string) {
    await this.access.getGroupAccess(user, groupId);
    return this.prisma.exam.findMany({
      where: {
        groupId,
        schoolId: user.schoolId,
        status: { not: ContentStatus.ARCHIVED },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async get(user: AuthenticatedUser, id: string) {
    const item = await this.prisma.exam.findFirst({
      where: { id, schoolId: user.schoolId },
    });
    if (!item) throw new NotFoundException();
    await this.access.getGroupAccess(user, item.groupId);
    return item;
  }

  async create(
    user: AuthenticatedUser,
    groupId: string,
    input: {
      title: string;
      description: string;
      scheduledAt: string;
      topic?: string;
    },
  ) {
    await this.access.assertGroupTeacher(user, groupId);
    const item = await this.prisma.exam.create({
      data: {
        groupId,
        schoolId: user.schoolId,
        authorId: user.id,
        title: input.title,
        description: input.description,
        topic: input.topic,
        scheduledAt: new Date(input.scheduledAt),
      },
    });
    const userIds = await this.notifications.studentIdsForGroup(groupId);
    await this.notifications.notifyUsers({
      userIds,
      type: NotificationType.EXAM_CREATED,
      title: 'New exam',
      message: item.title,
      resourceType: 'Exam',
      resourceId: item.id,
      dedupeKey: `exam-created:${item.id}`,
    });
    return item;
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    input: {
      title?: string;
      description?: string;
      scheduledAt?: string;
      topic?: string;
    },
  ) {
    const item = await this.get(user, id);
    await this.access.assertGroupTeacher(user, item.groupId);
    const updated = await this.prisma.exam.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        topic: input.topic,
        scheduledAt: input.scheduledAt
          ? new Date(input.scheduledAt)
          : undefined,
      },
    });
    const userIds = await this.notifications.studentIdsForGroup(item.groupId);
    await this.notifications.notifyUsers({
      userIds,
      type: NotificationType.EXAM_UPDATED,
      title: 'Exam updated',
      message: updated.title,
      resourceType: 'Exam',
      resourceId: updated.id,
      dedupeKey: `exam-updated:${updated.id}:${updated.updatedAt.toISOString()}`,
    });
    return updated;
  }

  async cancel(user: AuthenticatedUser, id: string) {
    const item = await this.get(user, id);
    await this.access.assertGroupTeacher(user, item.groupId);
    return this.prisma.exam.update({
      where: { id },
      data: { status: ContentStatus.CANCELLED },
    });
  }
}
