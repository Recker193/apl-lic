import { Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getById(actor: AuthenticatedUser, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, schoolId: actor.schoolId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  async updateMe(actor: AuthenticatedUser, dto: UpdateMeDto) {
    const data: {
      firstName?: string;
      lastName?: string;
      passwordHash?: string;
    } = {};
    if (dto.firstName) data.firstName = dto.firstName;
    if (dto.lastName) data.lastName = dto.lastName;
    if (dto.password) data.passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.update({
      where: { id: actor.id },
      data,
    });
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      schoolId: user.schoolId,
    };
  }

  async setActive(actor: AuthenticatedUser, id: string, isActive: boolean) {
    const user = await this.prisma.user.findFirst({
      where: { id, schoolId: actor.schoolId },
    });
    if (!user) {
      throw new NotFoundException();
    }
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { isActive } }),
      this.prisma.session.deleteMany({ where: { userId: id } }),
    ]);
    await this.audit.record({
      actorId: actor.id,
      schoolId: actor.schoolId,
      action: isActive ? 'user.activate' : 'user.suspend',
      resourceType: 'User',
      resourceId: id,
    });
    return { id, isActive };
  }
}
