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

  async toPublicUser(user: AuthenticatedUser) {
    const classMembership = await this.prisma.classMembership.findFirst({
      where: { studentId: user.id },
      include: {
        class: {
          include: {
            homeroomAssignments: {
              include: {
                teacher: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
    });

    const studentClass = classMembership?.class;
    const homeroomTeacher = studentClass?.homeroomAssignments?.[0]?.teacher;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      schoolId: user.schoolId,
      class: studentClass
        ? {
            id: studentClass.id,
            name: studentClass.name,
            schoolYear: studentClass.schoolYear,
          }
        : null,
      homeroomTeacher: homeroomTeacher
        ? {
            id: homeroomTeacher.id,
            firstName: homeroomTeacher.firstName,
            lastName: homeroomTeacher.lastName,
          }
        : null,
    };
  }

  async register(dto: RegisterDto) {
    const invite = await this.prisma.invitation.findUnique({
      where: { tokenHash: hashToken(dto.token) },
    });
    if (!invite || invite.expiresAt < new Date()) {
      throw new BadRequestException('Invalid invitation');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: invite.email },
    });
    if (invite.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        'Această invitație a fost deja folosită. Cereți administratorului un link nou.',
      );
    }
    if (existing) {
      throw new BadRequestException(
        'Există deja un cont cu acest email. Verificați emailul de confirmare sau cereți administratorului un link nou.',
      );
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

    const emailSent = await this.issueEmailToken(
      user.id,
      user.email,
      EmailTokenType.VERIFY_EMAIL,
    );
    // emailSent=false înseamnă că SMTP-ul a refuzat mesajul: contul există, dar
    // utilizatorul nu poate primi linkul, deci trebuie anunțat explicit.
    return { id: user.id, emailSent };
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
    const isProd = env.nodeEnv === 'production';
    res.clearCookie(env.cookieName, {
      path: '/',
      secure: env.cookieSecure || isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
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

  /**
   * Retrimite emailul de confirmare. Răspunde identic indiferent dacă adresa
   * există, pentru a nu divulga conturile înregistrate.
   */
  async resendVerification(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || !user.isActive || user.emailVerifiedAt) {
      return false;
    }
    return this.issueEmailToken(
      user.id,
      user.email,
      EmailTokenType.VERIFY_EMAIL,
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
    const isProd = env.nodeEnv === 'production';
    res.cookie(env.cookieName, raw, {
      httpOnly: true,
      secure: env.cookieSecure || isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      expires: expiresAt,
    });
  }

  private async issueEmailToken(
    userId: string,
    email: string,
    type: EmailTokenType,
  ): Promise<boolean> {
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
    const subject =
      type === EmailTokenType.VERIFY_EMAIL
        ? 'Confirmați adresa de email – Oktapod'
        : 'Resetare parolă – Oktapod';
    const instructions =
      type === EmailTokenType.VERIFY_EMAIL
        ? 'Deschideți linkul de mai jos pentru a confirma adresa de email și a vă putea conecta. Linkul este valabil 60 de minute.'
        : 'Deschideți linkul de mai jos pentru a vă seta o parolă nouă. Linkul este valabil 60 de minute.';
    return this.mail.send({
      to: email,
      subject,
      text: `${instructions}\n\n${env.appBaseUrl}/${path}?token=${raw}\n\nDacă nu ați solicitat acest mesaj, îl puteți ignora.\n\nEchipa Oktapod`,
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
