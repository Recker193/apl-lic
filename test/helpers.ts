import { INestApplication } from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { Test } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

export const TEST_PASSWORD = 'Password123!';

export type SeededUser = {
  id: string;
  email: string;
  role: UserRole;
  schoolId: string;
};

export type Fixture = {
  schoolA: { id: string; name: string };
  schoolB: { id: string; name: string };
  adminA: SeededUser;
  teacherA: SeededUser;
  studentA: SeededUser;
  studentPoster: SeededUser;
  studentB: SeededUser;
  teacherB: SeededUser;
  classA: { id: string };
  subjectA: { id: string };
  groupA: { id: string };
  groupB: { id: string };
};

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "AuditLog",
      "Notification",
      "AssignmentProgress",
      "Assignment",
      "Announcement",
      "Exam",
      "Material",
      "SchoolEvent",
      "GroupMembership",
      "Invitation",
      "EmailToken",
      "LoginAttempt",
      "Session",
      "ClassMembership",
      "SubjectGroup",
      "Subject",
      "SchoolClass",
      "User",
      "School",
      "Term",
      "GradeEntry",
      "GradeRevision",
      "Absence",
      "ConductGrade",
      "TermAverage",
      "HomeroomAssignment"
    RESTART IDENTITY CASCADE;
  `);
}

export async function seedFixture(prisma: PrismaClient): Promise<Fixture> {
  const passwordHash = await argon2.hash(TEST_PASSWORD);
  const schoolA = await prisma.school.create({ data: { name: 'Liceul A' } });
  const schoolB = await prisma.school.create({ data: { name: 'Liceul B' } });

  const adminA = await prisma.user.create({
    data: {
      email: 'admin.a@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'A',
      role: UserRole.ADMIN,
      schoolId: schoolA.id,
      emailVerifiedAt: new Date(),
    },
  });
  const teacherA = await prisma.user.create({
    data: {
      email: 'teacher.a@example.com',
      passwordHash,
      firstName: 'Teacher',
      lastName: 'A',
      role: UserRole.TEACHER,
      schoolId: schoolA.id,
      emailVerifiedAt: new Date(),
    },
  });
  const studentA = await prisma.user.create({
    data: {
      email: 'student.a@example.com',
      passwordHash,
      firstName: 'Student',
      lastName: 'A',
      role: UserRole.STUDENT,
      schoolId: schoolA.id,
      emailVerifiedAt: new Date(),
    },
  });
  const studentPoster = await prisma.user.create({
    data: {
      email: 'poster.a@example.com',
      passwordHash,
      firstName: 'Poster',
      lastName: 'A',
      role: UserRole.STUDENT,
      schoolId: schoolA.id,
      emailVerifiedAt: new Date(),
    },
  });
  const teacherB = await prisma.user.create({
    data: {
      email: 'teacher.b@example.com',
      passwordHash,
      firstName: 'Teacher',
      lastName: 'B',
      role: UserRole.TEACHER,
      schoolId: schoolB.id,
      emailVerifiedAt: new Date(),
    },
  });
  const studentB = await prisma.user.create({
    data: {
      email: 'student.b@example.com',
      passwordHash,
      firstName: 'Student',
      lastName: 'B',
      role: UserRole.STUDENT,
      schoolId: schoolB.id,
      emailVerifiedAt: new Date(),
    },
  });

  const classA = await prisma.schoolClass.create({
    data: { name: 'IX A', schoolYear: '2026-2027', schoolId: schoolA.id },
  });
  await prisma.classMembership.create({
    data: { classId: classA.id, studentId: studentA.id },
  });
  await prisma.classMembership.create({
    data: { classId: classA.id, studentId: studentPoster.id },
  });
  const classB = await prisma.schoolClass.create({
    data: { name: 'IX B', schoolYear: '2026-2027', schoolId: schoolB.id },
  });
  const subjectA = await prisma.subject.create({
    data: { name: 'Informatica', schoolId: schoolA.id },
  });
  const subjectB = await prisma.subject.create({
    data: { name: 'Informatica', schoolId: schoolB.id },
  });
  const groupA = await prisma.subjectGroup.create({
    data: {
      name: 'Info IX A',
      subjectId: subjectA.id,
      classId: classA.id,
      teacherId: teacherA.id,
      schoolId: schoolA.id,
    },
  });
  const groupB = await prisma.subjectGroup.create({
    data: {
      name: 'Info IX B',
      subjectId: subjectB.id,
      classId: classB.id,
      teacherId: teacherB.id,
      schoolId: schoolB.id,
    },
  });

  await prisma.groupMembership.createMany({
    data: [
      {
        groupId: groupA.id,
        userId: teacherA.id,
        membershipRole: 'TEACHER',
        canPost: true,
      },
      {
        groupId: groupA.id,
        userId: studentA.id,
        membershipRole: 'STUDENT',
        canPost: false,
      },
      {
        groupId: groupA.id,
        userId: studentPoster.id,
        membershipRole: 'STUDENT',
        canPost: true,
      },
      {
        groupId: groupB.id,
        userId: teacherB.id,
        membershipRole: 'TEACHER',
        canPost: true,
      },
      {
        groupId: groupB.id,
        userId: studentB.id,
        membershipRole: 'STUDENT',
        canPost: false,
      },
    ],
  });

  return {
    schoolA,
    schoolB,
    adminA,
    teacherA,
    studentA,
    studentPoster,
    studentB,
    teacherB,
    classA,
    subjectA,
    groupA,
    groupB,
  };
}

export async function createTestingApp(): Promise<{
  app: INestApplication;
  prisma: PrismaClient;
  fixture: Fixture;
}> {
  const prisma = new PrismaClient();
  await resetDatabase(prisma);
  const fixture = await seedFixture(prisma);

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  return { app, prisma, fixture };
}

export function login(
  app: INestApplication,
  email: string,
  password = TEST_PASSWORD,
) {
  return request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password });
}

export function authed(
  app: INestApplication,
  cookie: string,
  method: 'get' | 'post' | 'patch' | 'delete',
  url: string,
) {
  const req = request(app.getHttpServer())[method](url).set('Cookie', cookie);
  if (method !== 'get') {
    req.set('X-Requested-With', 'XMLHttpRequest');
  }
  return req;
}

export function sessionCookie(res: Response): string {
  const cookies = res.headers['set-cookie'];
  if (!cookies) {
    throw new Error('No set-cookie header');
  }
  const list = Array.isArray(cookies) ? cookies : [cookies];
  const found = list.find((item) => item.startsWith('hssa.sid='));
  if (!found) {
    throw new Error('Session cookie missing');
  }
  return found.split(';')[0];
}
