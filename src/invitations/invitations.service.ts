import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { generateOpaqueToken, hashToken } from '../common/crypto/tokens';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { loadEnv } from '../config/env';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateInvitationDto) {
    if (user.role === UserRole.STUDENT) {
      throw new ForbiddenException();
    }
    if (user.role === UserRole.TEACHER && dto.role !== UserRole.STUDENT) {
      throw new ForbiddenException();
    }

    if (dto.classId) {
      const schoolClass = await this.prisma.schoolClass.findFirst({
        where: { id: dto.classId, schoolId: user.schoolId },
      });
      if (!schoolClass) {
        throw new NotFoundException();
      }
    }
    if (dto.groupId) {
      const group = await this.prisma.subjectGroup.findFirst({
        where: { id: dto.groupId, schoolId: user.schoolId },
      });
      if (!group) {
        throw new NotFoundException();
      }
      if (user.role === UserRole.TEACHER && group.teacherId !== user.id) {
        throw new NotFoundException();
      }
    }

    const raw = generateOpaqueToken();
    const invitation = await this.prisma.invitation.create({
      data: {
        email: dto.email.toLowerCase(),
        role: dto.role,
        schoolId: user.schoolId,
        classId: dto.classId,
        groupId: dto.groupId,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdById: user.id,
      },
    });

    const env = loadEnv();
    await this.mail.send({
      to: invitation.email,
      subject: 'Invitation to High School Students App',
      text: `Open ${env.appBaseUrl}/register?token=${raw}`,
    });
    await this.audit.record({
      actorId: user.id,
      schoolId: user.schoolId,
      action: 'invitation.create',
      resourceType: 'Invitation',
      resourceId: invitation.id,
    });

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      token: raw,
    };
  }
}
