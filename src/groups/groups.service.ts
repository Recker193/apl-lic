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

  async update(
    user: AuthenticatedUser,
    id: string,
    input: { name?: string; teacherId?: string },
  ) {
    const existing = await this.access.assertGroupTeacher(user, id);

    if (input.teacherId && user.role !== UserRole.ADMIN) {
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

    const updated = await this.prisma.$transaction(async (tx) => {
      const group = await tx.subjectGroup.update({
        where: { id },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.teacherId ? { teacherId: input.teacherId } : {}),
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
