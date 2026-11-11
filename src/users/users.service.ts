import { Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly authService: AuthService,
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
    return this.authService.toPublicUser({
      ...user,
      isActive: user.isActive,
      emailVerifiedAt: user.emailVerifiedAt,
    });
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

  async deleteUser(actor: AuthenticatedUser, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, schoolId: actor.schoolId },
    });
    if (!user) {
      throw new NotFoundException('Utilizatorul nu a fost găsit.');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Sesiuni și token-uri de autentificare
      await tx.session.deleteMany({ where: { userId: id } });
      await tx.emailToken.deleteMany({ where: { userId: id } });
      await tx.loginAttempt.deleteMany({ where: { userId: id } });

      // 2. Notificări
      await tx.notification.deleteMany({ where: { userId: id } });

      // 3. Apartenențe la clase, grupuri, cluburi
      await tx.classMembership.deleteMany({ where: { studentId: id } });
      await tx.groupMembership.deleteMany({ where: { userId: id } });
      await tx.clubMember.deleteMany({ where: { userId: id } });
      await tx.assignmentProgress.deleteMany({ where: { studentId: id } });

      // 4. Date școlare asociate elevului (note, absențe, medii, purtare)
      await tx.gradeRevision.deleteMany({
        where: {
          OR: [
            { grade: { studentId: id } },
            { actorId: id },
          ],
        },
      });
      await tx.gradeEntry.deleteMany({ where: { studentId: id } });
      await tx.absence.deleteMany({ where: { studentId: id } });
      await tx.conductGrade.deleteMany({ where: { studentId: id } });
      await tx.termAverage.deleteMany({ where: { studentId: id } });

      // 5. Dacă utilizatorul a fost profesor:
      // Re-asociem sau curățăm referințele de profesor către un admin din școală
      const adminFallback = await tx.user.findFirst({
        where: { schoolId: actor.schoolId, role: 'ADMIN', NOT: { id } },
      });

      if (adminFallback) {
        await tx.gradeEntry.updateMany({
          where: { teacherId: id },
          data: { teacherId: adminFallback.id },
        });
        await tx.absence.updateMany({
          where: { recordedById: id },
          data: { recordedById: adminFallback.id },
        });
        await tx.conductGrade.updateMany({
          where: { setById: id },
          data: { setById: adminFallback.id },
        });
        await tx.subjectGroup.updateMany({
          where: { teacherId: id },
          data: { teacherId: adminFallback.id },
        });
        await tx.club.updateMany({
          where: { coordinatorId: id },
          data: { coordinatorId: adminFallback.id },
        });
        await tx.announcement.updateMany({
          where: { authorId: id },
          data: { authorId: adminFallback.id },
        });
        await tx.assignment.updateMany({
          where: { authorId: id },
          data: { authorId: adminFallback.id },
        });
        await tx.exam.updateMany({
          where: { authorId: id },
          data: { authorId: adminFallback.id },
        });
        await tx.material.updateMany({
          where: { authorId: id },
          data: { authorId: adminFallback.id },
        });
        await tx.schoolEvent.updateMany({
          where: { authorId: id },
          data: { authorId: adminFallback.id },
        });
        await tx.auditLog.updateMany({
          where: { actorId: id },
          data: { actorId: adminFallback.id },
        });
      }

      // 6. Timetable și Homeroom (Dirigenție)
      await tx.timetableEntry.deleteMany({ where: { teacherId: id } });
      await tx.homeroomAssignment.deleteMany({ where: { teacherId: id } });

      // 7. Invitații create de utilizator sau trimise către email-ul său
      await tx.invitation.deleteMany({
        where: {
          OR: [{ createdById: id }, { email: user.email.toLowerCase() }],
        },
      });

      // 8. Ștergerea definitivă a utilizatorului din tabela User
      // Aceasta eliberează email-ul datorită constrângerii UNIQUE pe coloana email!
      await tx.user.delete({ where: { id } });
    });

    await this.audit.record({
      actorId: actor.id,
      schoolId: actor.schoolId,
      action: 'user.delete',
      resourceType: 'User',
      resourceId: id,
      metadata: { deletedEmail: user.email, role: user.role },
    });

    return { success: true, message: 'Utilizator șters cu succes.' };
  }

  async listTeachers(actor: AuthenticatedUser) {
    return this.prisma.user.findMany({
      where: {
        schoolId: actor.schoolId,
        role: 'TEACHER',
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        homeroomAssignments: {
          select: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        taughtGroups: {
          select: {
            name: true,
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async list(actor: AuthenticatedUser, role?: string) {
    const where: any = { schoolId: actor.schoolId };
    if (role) {
      where.role = role;
    }
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        classMemberships: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                schoolYear: true,
              },
            },
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }
}
