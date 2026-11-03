import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async notifyUsers(input: {
    userIds: string[];
    type: NotificationType;
    title: string;
    message: string;
    resourceType: string;
    resourceId: string;
    dedupeKey: string;
    scheduledAt?: Date | null;
    sendImmediately?: boolean;
  }): Promise<void> {
    const sentAt = input.sendImmediately === false ? null : new Date();
    for (const userId of input.userIds) {
      await this.prisma.notification.upsert({
        where: {
          userId_dedupeKey: { userId, dedupeKey: input.dedupeKey },
        },
        update: {},
        create: {
          userId,
          type: input.type,
          title: input.title,
          message: input.message,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          dedupeKey: input.dedupeKey,
          scheduledAt: input.scheduledAt ?? null,
          sentAt,
        },
      });
    }
  }

  async studentIdsForGroup(groupId: string): Promise<string[]> {
    const members = await this.prisma.groupMembership.findMany({
      where: { groupId, membershipRole: 'STUDENT' },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, sentAt: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async sendDueReminders(now = new Date()): Promise<number> {
    const windows = [
      { hours: 24, key: '24h' },
      { hours: 2, key: '2h' },
    ];
    let created = 0;
    for (const window of windows) {
      const from = new Date(now.getTime() + (window.hours - 0.25) * 3600 * 1000);
      const to = new Date(now.getTime() + (window.hours + 0.25) * 3600 * 1000);
      const assignments = await this.prisma.assignment.findMany({
        where: {
          status: 'PUBLISHED',
          dueAt: { gte: from, lte: to },
        },
      });
      for (const assignment of assignments) {
        const userIds = await this.studentIdsForGroup(assignment.groupId);
        const before = await this.prisma.notification.count();
        await this.notifyUsers({
          userIds,
          type: NotificationType.ASSIGNMENT_DUE_SOON,
          title: 'Assignment due soon',
          message: assignment.title,
          resourceType: 'Assignment',
          resourceId: assignment.id,
          dedupeKey: `assignment-due:${window.key}:${assignment.id}`,
          scheduledAt: assignment.dueAt,
        });
        const after = await this.prisma.notification.count();
        created += after - before;
      }
    }
    return created;
  }
}
