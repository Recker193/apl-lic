import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipRole, UserRole } from '@prisma/client';
import { AccessService } from '../common/access/access.service';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthenticatedUser) {
    // Asigură automat că există grupuri/materii pentru clase dacă există materii definite în școală
    await this.ensureGroupsForSubjects(user);

    if (user.role === UserRole.ADMIN) {
      return this.prisma.subjectGroup.findMany({
        where: { schoolId: user.schoolId },
        include: {
          teacher: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          class: {
            select: { id: true, name: true, schoolYear: true },
          },
          subject: {
            select: { id: true, name: true },
          },
        },
        orderBy: { name: 'asc' },
      });
    }
    return this.prisma.subjectGroup.findMany({
      where: {
        schoolId: user.schoolId,
        OR: [
          { teacherId: user.id },
          { memberships: { some: { userId: user.id } } },
        ],
      },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        class: {
          select: { id: true, name: true, schoolYear: true },
        },
        subject: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Sincronizează automat materiile definite în școală cu grupurile de studiu (SubjectGroup),
   * astfel încât orice profesor/admin să poată alege materia din dropdown și să acorde note.
   */
  async ensureGroupsForSubjects(user: AuthenticatedUser) {
    try {
      const subjects = await this.prisma.subject.findMany({
        where: { schoolId: user.schoolId },
      });
      if (subjects.length === 0) return;

      const classes = await this.prisma.schoolClass.findMany({
        where: { schoolId: user.schoolId },
      });

      // Găsește un profesor sau un admin titular fallback pentru grup
      const fallbackTeacher =
        (await this.prisma.user.findFirst({
          where: { schoolId: user.schoolId, role: UserRole.TEACHER, isActive: true },
        })) ||
        (await this.prisma.user.findFirst({
          where: { schoolId: user.schoolId, role: UserRole.ADMIN },
        }));

      if (!fallbackTeacher) return;

      for (const subj of subjects) {
        if (classes.length > 0) {
          for (const cls of classes) {
            const existing = await this.prisma.subjectGroup.findFirst({
              where: {
                schoolId: user.schoolId,
                subjectId: subj.id,
                classId: cls.id,
              },
            });
            if (!existing) {
              const created = await this.prisma.subjectGroup.create({
                data: {
                  schoolId: user.schoolId,
                  subjectId: subj.id,
                  classId: cls.id,
                  teacherId: user.role === UserRole.TEACHER ? user.id : fallbackTeacher.id,
                  name: `${subj.name} - ${cls.name}`,
                },
              });
              // Înscrie profesorul în grup
              await this.prisma.groupMembership.upsert({
                where: { groupId_userId: { groupId: created.id, userId: created.teacherId } },
                update: {},
                create: {
                  groupId: created.id,
                  userId: created.teacherId,
                  membershipRole: MembershipRole.TEACHER,
                  canPost: true,
                },
              });
              // Înscrie automat elevii clasei în grupul materiei
              const students = await this.prisma.classMembership.findMany({
                where: { classId: cls.id },
              });
              for (const st of students) {
                await this.prisma.groupMembership.upsert({
                  where: { groupId_userId: { groupId: created.id, userId: st.studentId } },
                  update: {},
                  create: {
                    groupId: created.id,
                    userId: st.studentId,
                    membershipRole: MembershipRole.STUDENT,
                    canPost: false,
                  },
                });
              }
            }
          }
        } else {
          // Dacă nu există încă o clasă creată, creăm o clasă implicită sau grup general pentru materie
          const existing = await this.prisma.subjectGroup.findFirst({
            where: { schoolId: user.schoolId, subjectId: subj.id },
          });
          if (!existing) {
            let defaultClass = await this.prisma.schoolClass.findFirst({
              where: { schoolId: user.schoolId },
            });
            if (!defaultClass) {
              defaultClass = await this.prisma.schoolClass.create({
                data: {
                  name: 'Clasa Generală',
                  schoolYear: '2026-2027',
                  schoolId: user.schoolId,
                },
              });
            }
            const created = await this.prisma.subjectGroup.create({
              data: {
                schoolId: user.schoolId,
                subjectId: subj.id,
                classId: defaultClass.id,
                teacherId: user.role === UserRole.TEACHER ? user.id : fallbackTeacher.id,
                name: subj.name,
              },
            });
            await this.prisma.groupMembership.upsert({
              where: { groupId_userId: { groupId: created.id, userId: created.teacherId } },
              update: {},
              create: {
                groupId: created.id,
                userId: created.teacherId,
                membershipRole: MembershipRole.TEACHER,
                canPost: true,
              },
            });
          }
        }
      }
    } catch (e) {
      // Ignoră erorile neesențiale de auto-asigurare pentru a nu bloca request-ul
    }
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    input: { name?: string; teacherId?: string; classId?: string },
  ) {
    const existing = await this.access.assertGroupTeacher(user, id);

    if ((input.teacherId || input.classId) && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException();
    }

    if (input.teacherId) {
      const newTeacher = await this.prisma.user.findFirst({
        where: { id: input.teacherId, schoolId: user.schoolId, role: UserRole.TEACHER },
      });
      if (!newTeacher) {
        throw new NotFoundException();
      }
    }

    if (input.classId) {
      const newClass = await this.prisma.schoolClass.findFirst({
        where: { id: input.classId, schoolId: user.schoolId },
      });
      if (!newClass) {
        throw new NotFoundException('Clasa nu a fost găsită');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const group = await tx.subjectGroup.update({
        where: { id },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.teacherId ? { teacherId: input.teacherId } : {}),
          ...(input.classId ? { classId: input.classId } : {}),
        },
      });

      if (input.teacherId && input.teacherId !== existing.teacherId) {
        await tx.groupMembership.upsert({
          where: { groupId_userId: { groupId: id, userId: input.teacherId } },
          update: { membershipRole: MembershipRole.TEACHER, canPost: true },
          create: {
            groupId: id,
            userId: input.teacherId,
            membershipRole: MembershipRole.TEACHER,
            canPost: true,
          },
        });
      }

      // Dacă s-a schimbat clasa de predare, sincronizăm elevii noii clase în grupul materiei
      if (input.classId && input.classId !== existing.classId) {
        // Ștergem membrii elevi anteriori
        await tx.groupMembership.deleteMany({
          where: { groupId: id, membershipRole: MembershipRole.STUDENT },
        });

        // Adăugăm elevii noii clase
        const newClassStudents = await tx.classMembership.findMany({
          where: { classId: input.classId },
        });

        for (const membership of newClassStudents) {
          await tx.groupMembership.create({
            data: {
              groupId: id,
              userId: membership.studentId,
              membershipRole: MembershipRole.STUDENT,
              canPost: false,
            },
          });
        }
      }

      return group;
    });

    await this.audit.record({
      actorId: user.id,
      schoolId: user.schoolId,
      action: 'group.update',
      resourceType: 'SubjectGroup',
      resourceId: updated.id,
      metadata: { name: input.name, teacherId: input.teacherId },
    });

    return updated;
  }

  async get(user: AuthenticatedUser, id: string) {
    const access = await this.access.getGroupAccess(user, id);
    return access.group;
  }

  async create(
    user: AuthenticatedUser,
    input: { subjectId: string; classId: string; name: string; teacherId?: string },
  ) {
    const teacherId =
      user.role === UserRole.ADMIN && input.teacherId
        ? input.teacherId
        : user.id;

    if (user.role === UserRole.STUDENT) {
      throw new ForbiddenException();
    }

    const subject = await this.prisma.subject.findFirst({
      where: { id: input.subjectId, schoolId: user.schoolId },
    });
    const schoolClass = await this.prisma.schoolClass.findFirst({
      where: { id: input.classId, schoolId: user.schoolId },
    });
    const teacher = await this.prisma.user.findFirst({
      where: { id: teacherId, schoolId: user.schoolId, role: UserRole.TEACHER },
    });
    if (!subject || !schoolClass || !teacher) {
      throw new NotFoundException();
    }
    if (user.role === UserRole.TEACHER && teacherId !== user.id) {
      throw new ForbiddenException();
    }

    const group = await this.prisma.$transaction(async (tx) => {
      const created = await tx.subjectGroup.create({
        data: {
          subjectId: subject.id,
          classId: schoolClass.id,
          teacherId: teacher.id,
          schoolId: user.schoolId,
          name: input.name,
        },
      });
      await tx.groupMembership.create({
        data: {
          groupId: created.id,
          userId: teacher.id,
          membershipRole: MembershipRole.TEACHER,
          canPost: true,
        },
      });
      const students = await tx.classMembership.findMany({
        where: { classId: schoolClass.id },
      });
      for (const student of students) {
        await tx.groupMembership.create({
          data: {
            groupId: created.id,
            userId: student.studentId,
            membershipRole: MembershipRole.STUDENT,
            canPost: false,
          },
        });
      }
      return created;
    });

    await this.audit.record({
      actorId: user.id,
      schoolId: user.schoolId,
      action: 'group.create',
      resourceType: 'SubjectGroup',
      resourceId: group.id,
    });
    return group;
  }

  async members(user: AuthenticatedUser, groupId: string) {
    await this.access.getGroupAccess(user, groupId);
    return this.prisma.groupMembership.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  async addMember(
    user: AuthenticatedUser,
    groupId: string,
    memberUserId: string,
  ) {
    await this.access.assertGroupTeacher(user, groupId);
    const member = await this.prisma.user.findFirst({
      where: { id: memberUserId, schoolId: user.schoolId },
    });
    if (!member) throw new NotFoundException();
    return this.prisma.groupMembership.upsert({
      where: { groupId_userId: { groupId, userId: memberUserId } },
      update: {},
      create: {
        groupId,
        userId: memberUserId,
        membershipRole:
          member.role === UserRole.TEACHER
            ? MembershipRole.TEACHER
            : MembershipRole.STUDENT,
        canPost: member.role === UserRole.TEACHER,
      },
    });
  }

  async updateCanPost(
    user: AuthenticatedUser,
    groupId: string,
    memberUserId: string,
    canPost: boolean,
  ) {
    await this.access.assertGroupTeacher(user, groupId);
    if (memberUserId === user.id && user.role === UserRole.STUDENT) {
      throw new ForbiddenException();
    }
    const membership = await this.prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId: memberUserId } },
    });
    if (!membership) throw new NotFoundException();
    const updated = await this.prisma.groupMembership.update({
      where: { id: membership.id },
      data: { canPost },
    });
    await this.audit.record({
      actorId: user.id,
      schoolId: user.schoolId,
      action: 'group.permission',
      resourceType: 'GroupMembership',
      resourceId: updated.id,
      metadata: { canPost, memberUserId },
    });
    return updated;
  }
}
