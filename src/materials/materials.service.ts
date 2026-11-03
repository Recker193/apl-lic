import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MaterialKind, NotificationType } from '@prisma/client';
import { AccessService } from '../common/access/access.service';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { loadEnv } from '../config/env';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class MaterialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(user: AuthenticatedUser, groupId: string) {
    await this.access.getGroupAccess(user, groupId);
    return this.prisma.material.findMany({
      where: { groupId, schoolId: user.schoolId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(user: AuthenticatedUser, id: string) {
    const item = await this.prisma.material.findFirst({
      where: { id, schoolId: user.schoolId },
    });
    if (!item) throw new NotFoundException();
    await this.access.getGroupAccess(user, item.groupId);
    return item;
  }

  async createLink(
    user: AuthenticatedUser,
    groupId: string,
    input: { title: string; description?: string; url: string },
  ) {
    await this.access.assertGroupTeacher(user, groupId);
    const item = await this.prisma.material.create({
      data: {
        groupId,
        schoolId: user.schoolId,
        authorId: user.id,
        title: input.title,
        description: input.description,
        kind: MaterialKind.LINK,
        url: input.url,
      },
    });
    await this.notify(groupId, item.id, item.title);
    return item;
  }

  async createFile(
    user: AuthenticatedUser,
    groupId: string,
    input: { title: string; description?: string },
    file?: { buffer: Buffer; mimetype: string; size: number },
  ) {
    await this.access.assertGroupTeacher(user, groupId);
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const env = loadEnv();
    if (file.size > env.maxUploadBytes) {
      throw new BadRequestException('File too large');
    }
    if (!this.storage.isAllowedMime(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }
    const fileKey = await this.storage.save(file.buffer, file.mimetype);
    const item = await this.prisma.material.create({
      data: {
        groupId,
        schoolId: user.schoolId,
        authorId: user.id,
        title: input.title,
        description: input.description,
        kind: MaterialKind.FILE,
        fileKey,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    });
    await this.notify(groupId, item.id, item.title);
    return item;
  }

  async download(user: AuthenticatedUser, id: string) {
    const item = await this.get(user, id);
    if (item.kind !== MaterialKind.FILE || !item.fileKey) {
      throw new NotFoundException();
    }
    const buffer = await this.storage.read(item.fileKey);
    return { buffer, mimeType: item.mimeType ?? 'application/octet-stream', title: item.title };
  }

  async remove(user: AuthenticatedUser, id: string) {
    const item = await this.get(user, id);
    await this.access.assertGroupTeacher(user, item.groupId);
    await this.prisma.material.delete({ where: { id } });
  }

  private async notify(groupId: string, id: string, title: string) {
    const userIds = await this.notifications.studentIdsForGroup(groupId);
    await this.notifications.notifyUsers({
      userIds,
      type: NotificationType.MATERIAL_CREATED,
      title: 'New material',
      message: title,
      resourceType: 'Material',
      resourceId: id,
      dedupeKey: `material-created:${id}`,
    });
  }
}
