import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  list(user: AuthenticatedUser) {
    return this.prisma.schoolClass.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { name: 'asc' },
    });
  }

  async get(user: AuthenticatedUser, id: string) {
    const item = await this.prisma.schoolClass.findFirst({
      where: { id, schoolId: user.schoolId },
      include: {
        memberships: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
    if (!item) throw new NotFoundException();
    return item;
  }

  create(user: AuthenticatedUser, name: string, schoolYear: string) {
    return this.prisma.schoolClass.create({
      data: { name, schoolYear, schoolId: user.schoolId },
    });
  }

  async addStudent(
    user: AuthenticatedUser,
    classId: string,
    studentId: string,
  ) {
    const schoolClass = await this.get(user, classId);
    const student = await this.prisma.user.findFirst({
      where: { id: studentId, schoolId: user.schoolId, role: 'STUDENT' },
    });
    if (!student) throw new NotFoundException();

    // Dacă este deja înscris în altă clasă, îl transferăm (eliminăm vechea apartenență)
    await this.prisma.classMembership.deleteMany({
      where: { studentId },
    });

    const membership = await this.prisma.classMembership.create({
      data: { studentId, classId: schoolClass.id },
    });

    // Îl adăugăm automat și în grupurile asociate clasei
    const classGroups = await this.prisma.subjectGroup.findMany({
      where: { classId: schoolClass.id },
    });
    for (const group of classGroups) {
      await this.prisma.groupMembership.upsert({
        where: {
          groupId_userId: { groupId: group.id, userId: studentId },
        },
        update: {},
        create: {
          groupId: group.id,
          userId: studentId,
          membershipRole: 'STUDENT',
          canPost: false,
        },
      });
    }

    return membership;
  }

  async transferStudent(
    user: AuthenticatedUser,
    fromClassId: string,
    toClassId: string,
    studentId: string,
  ) {
    await this.removeStudent(user, fromClassId, studentId);
    return this.addStudent(user, toClassId, studentId);
  }

  async removeStudent(
    user: AuthenticatedUser,
    classId: string,
    studentId: string,
  ) {
    const schoolClass = await this.get(user, classId);

    // Eliminăm din grupurile clasei vechi
    const classGroups = await this.prisma.subjectGroup.findMany({
      where: { classId: schoolClass.id },
    });
    const groupIds = classGroups.map((g) => g.id);
    if (groupIds.length > 0) {
      await this.prisma.groupMembership.deleteMany({
        where: {
          userId: studentId,
          groupId: { in: groupIds },
        },
      });
    }

    return this.prisma.classMembership.deleteMany({
      where: { classId: schoolClass.id, studentId },
    });
  }
}
