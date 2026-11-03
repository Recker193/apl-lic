import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  EmailTokenType,
  InvitationStatus,
  MembershipRole,
  UserRole,
} from '@prisma/client';
import * as argon2 from 'argon2';
import type { Response } from 'express';
import { generateOpaqueToken, hashToken } from '../common/crypto/tokens';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { loadEnv } from '../config/env';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_THRESHOLD = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  toPublicUser(user: AuthenticatedUser) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      schoolId: user.schoolId,
    };
  }

  async register(dto: RegisterDto) {
    const invite = await this.prisma.invitation.findUnique({
      where: { tokenHash: hashToken(dto.token) },
    });
    if (
      !invite ||
      invite.status !== InvitationStatus.PENDING ||
      invite.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid invitation');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: invite.email },
    });
    if (existing) {
      throw new BadRequestException('Invalid invitation');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: invite.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: invite.role,
          schoolId: invite.schoolId,
        },
      });

      await tx.invitation.update({
        where: { id: invite.id },
        data: { status: InvitationStatus.ACCEPTED },
      });

      if (invite.role === UserRole.STUDENT && invite.classId) {
        await tx.classMembership.create({
          data: { studentId: created.id, classId: invite.classId },
        });
        const classGroups = await tx.subjectGroup.findMany({
          where: { classId: invite.classId },
        });
        for (const group of classGroups) {
          await tx.groupMembership.upsert({
            where: {
              groupId_userId: { groupId: group.id, userId: created.id },
            },
            update: {},
            create: {
              groupId: group.id,
              userId: created.id,
              membershipRole: MembershipRole.STUDENT,
              canPost: false,
            },
          });
        }
      }

      if (invite.groupId) {
        await tx.groupMembership.upsert({
          where: {
            groupId_userId: { groupId: invite.groupId, userId: created.id },
          },
          update: {},
          create: {
            groupId: invite.groupId,
            userId: created.id,
            membershipRole:
              invite.role === UserRole.TEACHER
                ? MembershipRole.TEACHER
                : MembershipRole.STUDENT,
            canPost: invite.role === UserRole.TEACHER,
          },
        });
      }

      return created;
    });

    await this.issueEmailToken(user.id, user.email, EmailTokenType.VERIFY_EMAIL);
    return { id: user.id };
  }

  async login(
    dto: LoginDto,
    res: Response,
    meta: { ip: string; userAgent?: string },
  ) {
    const normalizedEmail = dto.email.toLowerCase();
    const recentFailures = await this.prisma.loginAttempt.count({
      where: {
        email: normalizedEmail,
        success: false,
        createdAt: { gte: new Date(Date.now() - LOCKOUT_WINDOW_MS) },
      },
    });
    if (recentFailures >= LOCKOUT_THRESHOLD) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    const valid =
      user &&
      user.isActive &&
      user.emailVerifiedAt &&
      (await argon2.verify(user.passwordHash, dto.password));

    await this.prisma.loginAttempt.create({
      data: {
        email: normalizedEmail,
        ipAddress: meta.ip,
        success: Boolean(valid),
        userId: user?.id,
      },
    });

    if (!valid || !user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.createSessionCookie(user.id, res, meta);
    return this.toPublicUser({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      schoolId: user.schoolId,
      isActive: user.isActive,
      emailVerifiedAt: user.emailVerifiedAt,
    });
  }

  async logout(rawToken: string | undefined, res: Response): Promise<void> {
    const env = loadEnv();
    if (rawToken) {
      await this.prisma.session.deleteMany({
        where: { tokenHash: hashToken(rawToken) },
      });
    }
    res.clearCookie(env.cookieName, { path: '/' });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || !user.isActive) {
      return;
    }
    await this.issueEmailToken(
      user.id,
      user.email,
      EmailTokenType.RESET_PASSWORD,
    );
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const record = await this.consumeEmailToken(
      token,
      EmailTokenType.RESET_PASSWORD,
    );
    const passwordHash = await argon2.hash(password);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.session.deleteMany({ where: { userId: record.userId } }),
    ]);
  }

  async verifyEmail(token: string): Promise<void> {
    const record = await this.consumeEmailToken(
      token,
      EmailTokenType.VERIFY_EMAIL,
    );
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  private async createSessionCookie(
    userId: string,
    res: Response,
    meta: { ip: string; userAgent?: string },
  ): Promise<void> {
    const env = loadEnv();
    const raw = generateOpaqueToken();
    const expiresAt = new Date(
      Date.now() + env.sessionTtlHours * 60 * 60 * 1000,
    );
    await this.prisma.session.create({
      data: {
        userId,
        tokenHash: hashToken(raw),
        expiresAt,
        ipAddress: meta.ip,
        userAgent: meta.userAgent?.slice(0, 200),
      },
    });
    res.cookie(env.cookieName, raw, {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });
  }

  private async issueEmailToken(
    userId: string,
    email: string,
    type: EmailTokenType,
  ): Promise<void> {
    const env = loadEnv();
    const raw = generateOpaqueToken();
    await this.prisma.emailToken.create({
      data: {
        userId,
        type,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const path =
      type === EmailTokenType.VERIFY_EMAIL ? 'verify-email' : 'reset-password';
    await this.mail.send({
      to: email,
      subject:
        type === EmailTokenType.VERIFY_EMAIL
          ? 'Verify your email'
          : 'Reset your password',
      text: `Open ${env.appBaseUrl}/${path}?token=${raw}`,
    });
  }

  private async consumeEmailToken(token: string, type: EmailTokenType) {
    const record = await this.prisma.emailToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (
      !record ||
      record.type !== type ||
      record.usedAt ||
      record.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid token');
    }
    await this.prisma.emailToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return record;
  }
}
