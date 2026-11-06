import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  authed,
  createTestingApp,
  Fixture,
  login,
  sessionCookie,
} from './helpers';

describe('Catalog (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let fixture: Fixture;
  let studentCookie: string;
  let teacherCookie: string;
  let teacherBCookie: string;
  let adminCookie: string;

  beforeAll(async () => {
    const ctx = await createTestingApp();
    app = ctx.app;
    prisma = ctx.prisma;
    fixture = ctx.fixture;
    studentCookie = sessionCookie(await login(app, fixture.studentA.email));
    teacherCookie = sessionCookie(await login(app, fixture.teacherA.email));
    teacherBCookie = sessionCookie(await login(app, fixture.teacherB.email));
    adminCookie = sessionCookie(await login(app, fixture.adminA.email));
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe('Grades', () => {
    it('lets teacher add a grade to their group', async () => {
      // First create a term
      const termRes = await authed(
        app,
        adminCookie,
        'post',
        '/api/v1/terms',
      ).send({
        schoolYear: '2024-2025',
        number: 1,
        startsAt: '2024-09-01',
        endsAt: '2025-01-31',
      });
      expect(termRes.status).toBe(201);
      const termId = termRes.body.id;

      const res = await authed(
        app,
        teacherCookie,
        'post',
        `/api/v1/groups/${fixture.groupA.id}/grades`,
      ).send({
        studentId: fixture.studentA.id,
        type: 'TEST',
        value: 8,
        gradedAt: '2024-10-15',
      });
      expect(res.status).toBe(201);
      expect(res.body.value).toBe(8);
    });

    it('blocks student from adding grades', async () => {
      const res = await authed(
        app,
        studentCookie,
        'post',
        `/api/v1/groups/${fixture.groupA.id}/grades`,
      ).send({
        studentId: fixture.studentA.id,
        type: 'TEST',
        value: 8,
        gradedAt: '2024-10-15',
      });
      expect(res.status).toBe(404); // 404 instead of 403 to avoid info leakage
    });

    it('lets student view their own grades', async () => {
      const res = await authed(
        app,
        studentCookie,
        'get',
        `/api/v1/students/${fixture.studentA.id}/grades`,
      );
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('blocks student from viewing another student grades', async () => {
      const res = await authed(
        app,
        studentCookie,
        'get',
        `/api/v1/students/${fixture.studentB.id}/grades`,
      );
      expect(res.status).toBe(403);
    });

    it('lets teacher view grades in their group', async () => {
      const res = await authed(
        app,
        teacherCookie,
        'get',
        `/api/v1/groups/${fixture.groupA.id}/grades`,
      );
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('blocks teacher from other school viewing grades', async () => {
      const res = await authed(
        app,
        teacherCookie,
        'get',
        `/api/v1/groups/${fixture.groupB.id}/grades`,
      );
      expect(res.status).toBe(404);
    });

    it('lets teacher correct a grade with reason', async () => {
      // First create a grade
      const createRes = await authed(
        app,
        teacherCookie,
        'post',
        `/api/v1/groups/${fixture.groupA.id}/grades`,
      ).send({
        studentId: fixture.studentA.id,
        type: 'TEST',
        value: 7,
        gradedAt: '2024-10-15',
      });
      const gradeId = createRes.body.id;

      const res = await authed(
        app,
        teacherCookie,
        'patch',
        `/api/v1/grades/${gradeId}`,
      ).send({
        value: 8,
        reason: 'Correction: recalculation',
      });
      expect(res.status).toBe(200);
      expect(res.body.value).toBe(8);
    });

    it('lets teacher void a grade with reason', async () => {
      const createRes = await authed(
        app,
        teacherCookie,
        'post',
        `/api/v1/groups/${fixture.groupA.id}/grades`,
      ).send({
        studentId: fixture.studentA.id,
        type: 'TEST',
        value: 5,
        gradedAt: '2024-10-15',
      });
      const gradeId = createRes.body.id;

      const res = await authed(
        app,
        teacherCookie,
        'delete',
        `/api/v1/grades/${gradeId}`,
      ).send({
        reason: 'Mistake in entry',
      });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('VOIDED');
    });

    it('lets teacher view grade history', async () => {
      const createRes = await authed(
        app,
        teacherCookie,
        'post',
        `/api/v1/groups/${fixture.groupA.id}/grades`,
      ).send({
        studentId: fixture.studentA.id,
        type: 'TEST',
        value: 9,
        gradedAt: '2024-10-15',
      });
      const gradeId = createRes.body.id;

      const res = await authed(
        app,
        teacherCookie,
        'get',
        `/api/v1/grades/${gradeId}/history`,
      );
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Absences', () => {
    it('lets teacher record an absence', async () => {
      const res = await authed(
        app,
        teacherCookie,
        'post',
        '/api/v1/absences',
      ).send({
        studentId: fixture.studentA.id,
        date: '2024-10-15',
        groupId: fixture.groupA.id,
      });
      expect(res.status).toBe(201);
    });

    it('blocks student from recording absences', async () => {
      const res = await authed(
        app,
        studentCookie,
        'post',
        '/api/v1/absences',
      ).send({
        studentId: fixture.studentA.id,
        date: '2024-10-15',
        groupId: fixture.groupA.id,
      });
      expect(res.status).toBe(404); // 404 to avoid info leakage
    });

    it('lets student view their own absences', async () => {
      const res = await authed(
        app,
        studentCookie,
        'get',
        `/api/v1/students/${fixture.studentA.id}/absences`,
      );
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('blocks student from viewing another student absences', async () => {
      const res = await authed(
        app,
        studentCookie,
        'get',
        `/api/v1/students/${fixture.studentB.id}/absences`,
      );
      expect(res.status).toBe(403);
    });
  });

  describe('Terms', () => {
    it('lets admin create a term', async () => {
      const res = await authed(
        app,
        adminCookie,
        'post',
        '/api/v1/terms',
      ).send({
        schoolYear: '2024-2025',
        number: 2,
        startsAt: '2025-02-01',
        endsAt: '2025-06-30',
      });
      expect(res.status).toBe(201);
    });

    it('blocks teacher from creating terms', async () => {
      const res = await authed(
        app,
        teacherCookie,
        'post',
        '/api/v1/terms',
      ).send({
        schoolYear: '2024-2025',
        number: 2,
        startsAt: '2025-02-01',
        endsAt: '2025-06-30',
      });
      expect(res.status).toBe(403);
    });

    it('lets admin close a term', async () => {
      const termRes = await authed(
        app,
        adminCookie,
        'post',
        '/api/v1/terms',
      ).send({
        schoolYear: '2025-2026',
        number: 1,
        startsAt: '2025-09-01',
        endsAt: '2026-01-31',
      });
      const termId = termRes.body.id;

      const res = await authed(
        app,
        adminCookie,
        'patch',
        `/api/v1/terms/${termId}/close`,
      );
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('CLOSED');
    });

    it('blocks teacher from closing terms', async () => {
      const termRes = await authed(
        app,
        adminCookie,
        'post',
        '/api/v1/terms',
      ).send({
        schoolYear: '2026-2027',
        number: 1,
        startsAt: '2026-09-01',
        endsAt: '2027-01-31',
      });
      const termId = termRes.body.id;

      const res = await authed(
        app,
        teacherCookie,
        'patch',
        `/api/v1/terms/${termId}/close`,
      );
      expect(res.status).toBe(403);
    });
  });

  describe('Homeroom', () => {
    it('lets admin create homeroom assignment', async () => {
      const res = await authed(
        app,
        adminCookie,
        'post',
        '/api/v1/homeroom-assignments',
      ).send({
        classId: fixture.classA.id,
        teacherId: fixture.teacherA.id,
        schoolYear: '2024-2025',
      });
      expect(res.status).toBe(201);
    });

    it('blocks teacher from creating homeroom assignment', async () => {
      const res = await authed(
        app,
        teacherCookie,
        'post',
        '/api/v1/homeroom-assignments',
      ).send({
        classId: fixture.classA.id,
        teacherId: fixture.teacherA.id,
        schoolYear: '2024-2025',
      });
      expect(res.status).toBe(403);
    });

    it('lets homeroom teacher set conduct grade', async () => {
      const assignmentRes = await authed(
        app,
        adminCookie,
        'post',
        '/api/v1/homeroom-assignments',
      ).send({
        classId: fixture.classA.id,
        teacherId: fixture.teacherA.id,
        schoolYear: '2024-2025',
      });

      const termRes = await authed(
        app,
        adminCookie,
        'post',
        '/api/v1/terms',
      ).send({
        schoolYear: '2024-2025',
        number: 1,
        startsAt: '2024-09-01',
        endsAt: '2025-01-31',
      });
      const termId = termRes.body.id;

      const res = await authed(
        app,
        teacherCookie,
        'put',
        `/api/v1/classes/${fixture.classA.id}/conduct/${fixture.studentA.id}`,
      ).send({
        value: 9,
      });
      expect(res.status).toBe(200);
      expect(res.body.value).toBe(9);
    });

    it('blocks non-homeroom teacher from setting conduct grade', async () => {
      // First assign teacherA as homeroom
      await authed(
        app,
        adminCookie,
        'post',
        '/api/v1/homeroom-assignments',
      ).send({
        classId: fixture.classA.id,
        teacherId: fixture.teacherA.id,
        schoolYear: '2024-2025',
      });

      // Now teacherB should be blocked
      const res = await authed(
        app,
        teacherBCookie,
        'put',
        `/api/v1/classes/${fixture.classA.id}/conduct/${fixture.studentA.id}`,
      ).send({
        value: 9,
      });
      expect(res.status).toBe(403);
    });
  });
});
