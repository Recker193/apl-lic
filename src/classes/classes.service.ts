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
    return this.prisma.classMembership.upsert({
      where: { studentId_classId: { studentId, classId: schoolClass.id } },
      update: {},
      create: { studentId, classId: schoolClass.id },
    });
  }
}
