import { Injectable, NotFoundException } from '@nestjs/common';
import { MembershipRole, SubjectGroup } from '@prisma/client';
import { AuthenticatedUser } from '../types/authenticated-user';
import { PrismaService } from '../../prisma/prisma.service';

export type GroupAccess = {
  group: SubjectGroup;
  canPost: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
};

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  assertSameSchool(user: AuthenticatedUser, schoolId: string): void {
    if (user.schoolId !== schoolId) {
      throw new NotFoundException();
    }
  }

  async getGroupAccess(
    user: AuthenticatedUser,
    groupId: string,
  ): Promise<GroupAccess> {
    const group = await this.prisma.subjectGroup.findFirst({
      where: { id: groupId, schoolId: user.schoolId },
    });
    if (!group) {
      throw new NotFoundException();
    }

    if (user.role === 'ADMIN') {
      return { group, canPost: true, isTeacher: false, isAdmin: true };
    }

    const membership = await this.prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
    });

    const isTeacher =
      group.teacherId === user.id ||
      membership?.membershipRole === MembershipRole.TEACHER;

    // Profesorii pot accesa orice grup din școala lor (pentru acordare note/absențe — MVP)
    if (user.role === 'TEACHER') {
      return {
        group,
        canPost: Boolean(isTeacher || membership?.canPost),
        isTeacher: true,
        isAdmin: false,
      };
    }

    if (!membership && !isTeacher) {
      throw new NotFoundException();
    }

    return {
      group,
      canPost: Boolean(isTeacher || membership?.canPost),
      isTeacher,
      isAdmin: false,
    };
  }

  async assertGroupTeacher(
    user: AuthenticatedUser,
    groupId: string,
  ): Promise<SubjectGroup> {
    const access = await this.getGroupAccess(user, groupId);
    // Admin are mereu acces; Profesorii pot nota la orice grup din școala lor (MVP)
    if (!access.isTeacher && !access.isAdmin) {
      // Fallback: dacă profesorul nu e member, verificăm că grupul e din aceeași școală
      if (user.role === 'TEACHER') {
        // Permite profesorilor să acorde note la orice grup din școala lor
        return access.group;
      }
      throw new NotFoundException();
    }
    return access.group;
  }
}
