import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus, NotificationType } from '@prisma/client';
import { AccessService } from '../common/access/access.service';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(user: AuthenticatedUser, groupId: string, page: number, limit: number) {
    await this.access.getGroupAccess(user, groupId);
    const where = {
      groupId,
      schoolId: user.schoolId,
      status: ContentStatus.PUBLISHED,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.announcement.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async get(user: AuthenticatedUser, id: string) {
    const item = await this.prisma.announcement.findFirst({
      where: { id, schoolId: user.schoolId, status: ContentStatus.PUBLISHED },
    });
    if (!item) throw new NotFoundException();
    await this.access.getGroupAccess(user, item.groupId);
    return item;
  }

  async create(
    user: AuthenticatedUser,
    groupId: string,
    input: { title: string; content: string; isPinned?: boolean },
  ) {
    const access = await this.access.getGroupAccess(user, groupId);
    if (!access.canPost) {
      throw new ForbiddenException();
    }
    const item = await this.prisma.announcement.create({
      data: {
        groupId,
        schoolId: user.schoolId,
        authorId: user.id,
        title: input.title,
        content: input.content,
        isPinned: Boolean(input.isPinned && (access.isTeacher || access.isAdmin)),
      },
    });
    const userIds = await this.notifications.studentIdsForGroup(groupId);
    await this.notifications.notifyUsers({
      userIds,
      type: NotificationType.ANNOUNCEMENT_CREATED,
      title: 'New announcement',
      message: item.title,
      resourceType: 'Announcement',
      resourceId: item.id,
      dedupeKey: `announcement-created:${item.id}`,
    });
    return item;
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    input: { title?: string; content?: string; isPinned?: boolean },
  ) {
    const item = await this.get(user, id);
    const access = await this.access.getGroupAccess(user, item.groupId);
    if (!access.isTeacher && !access.isAdmin && item.authorId !== user.id) {
      throw new ForbiddenException();
    }
    if (item.authorId === user.id && !access.canPost && !access.isTeacher) {
      throw new ForbiddenException();
    }
    return this.prisma.announcement.update({
      where: { id },
      data: input,
    });
  }

  async archive(user: AuthenticatedUser, id: string) {
    const item = await this.get(user, id);
    const access = await this.access.getGroupAccess(user, item.groupId);
    if (!access.isTeacher && !access.isAdmin && item.authorId !== user.id) {
      throw new ForbiddenException();
    }
    return this.prisma.announcement.update({
      where: { id },
      data: { status: ContentStatus.ARCHIVED },
    });
  }
}
