import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentProgressStatus,
  ContentStatus,
  NotificationType,
} from '@prisma/client';
import { AccessService } from '../common/access/access.service';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(user: AuthenticatedUser, groupId: string) {
    await this.access.getGroupAccess(user, groupId);
    const items = await this.prisma.assignment.findMany({
      where: { groupId, schoolId: user.schoolId, status: ContentStatus.PUBLISHED },
      orderBy: { dueAt: 'asc' },
      include: { progress: { where: { studentId: user.id } } },
    });
    // Elevul primește doar propriul progres, ca obiect (nu listă).
    return items.map(({ progress, ...rest }) =>
      user.role === 'STUDENT'
        ? { ...rest, progress: progress[0] ?? null }
        : rest,
    );
  }

  async get(user: AuthenticatedUser, id: string) {
    const item = await this.prisma.assignment.findFirst({
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
      dueAt: string;
      instructions?: string;
    },
  ) {
    await this.access.assertGroupTeacher(user, groupId);
    const dueAt = new Date(input.dueAt);
    if (Number.isNaN(dueAt.getTime()) || dueAt <= new Date()) {
      throw new BadRequestException('dueAt must be in the future');
    }
    const item = await this.prisma.assignment.create({
      data: {
        groupId,
        schoolId: user.schoolId,
        authorId: user.id,
        title: input.title,
        description: input.description,
        instructions: input.instructions,
        dueAt,
      },
    });
    const userIds = await this.notifications.studentIdsForGroup(groupId);
    await this.notifications.notifyUsers({
      userIds,
      type: NotificationType.ASSIGNMENT_CREATED,
      title: 'New assignment',
      message: item.title,
      resourceType: 'Assignment',
      resourceId: item.id,
      dedupeKey: `assignment-created:${item.id}`,
    });
    return item;
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    input: {
      title?: string;
      description?: string;
      dueAt?: string;
      instructions?: string;
    },
  ) {
    const item = await this.get(user, id);
    await this.access.assertGroupTeacher(user, item.groupId);
    const dueAt = input.dueAt ? new Date(input.dueAt) : undefined;
    const updated = await this.prisma.assignment.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        instructions: input.instructions,
        dueAt,
      },
    });
    const userIds = await this.notifications.studentIdsForGroup(item.groupId);
    await this.notifications.notifyUsers({
      userIds,
      type: NotificationType.ASSIGNMENT_UPDATED,
      title: 'Assignment updated',
      message: updated.title,
      resourceType: 'Assignment',
      resourceId: updated.id,
      dedupeKey: `assignment-updated:${updated.id}:${updated.updatedAt.toISOString()}`,
    });
    return updated;
  }

  async archive(user: AuthenticatedUser, id: string) {
    const item = await this.get(user, id);
    await this.access.assertGroupTeacher(user, item.groupId);
    return this.prisma.assignment.update({
      where: { id },
      data: { status: ContentStatus.ARCHIVED },
    });
  }

  async getProgress(user: AuthenticatedUser, assignmentId: string) {
    const assignment = await this.get(user, assignmentId);
    const access = await this.access.getGroupAccess(user, assignment.groupId);
    if (access.isTeacher || access.isAdmin) {
      return this.prisma.assignmentProgress.findMany({
        where: { assignmentId },
      });
    }
    return this.prisma.assignmentProgress.findMany({
      where: { assignmentId, studentId: user.id },
    });
  }

  async updateMyProgress(
    user: AuthenticatedUser,
    assignmentId: string,
    status: AssignmentProgressStatus,
  ) {
    const assignment = await this.get(user, assignmentId);
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException();
    }
    await this.access.getGroupAccess(user, assignment.groupId);
    return this.prisma.assignmentProgress.upsert({
      where: {
        assignmentId_studentId: { assignmentId, studentId: user.id },
      },
      update: { status },
      create: { assignmentId, studentId: user.id, status },
    });
  }
}
