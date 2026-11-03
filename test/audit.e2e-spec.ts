import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  authed,
  createTestingApp,
  Fixture,
  login,
  sessionCookie,
} from './helpers';

describe('Audit (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let fixture: Fixture;
  let adminCookie: string;
  let teacherCookie: string;
  let studentCookie: string;

  beforeAll(async () => {
    const ctx = await createTestingApp();
    app = ctx.app;
    prisma = ctx.prisma;
    fixture = ctx.fixture;
    adminCookie = sessionCookie(await login(app, fixture.adminA.email));
    teacherCookie = sessionCookie(await login(app, fixture.teacherA.email));
    studentCookie = sessionCookie(await login(app, fixture.studentA.email));
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('allows ADMIN to list audit logs for their school', async () => {
    // Perform an action that logs audit (create announcement or patch group)
    await authed(
      app,
      teacherCookie,
      'patch',
      `/api/v1/groups/${fixture.groupA.id}`,
    ).send({ name: 'Audited Group Update' });

    const res = await authed(app, adminCookie, 'get', '/api/v1/audit?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.items).toBeDefined();
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.items[0].resourceType).toBe('SubjectGroup');
  });

  it('forbids TEACHER and STUDENT from reading audit logs', async () => {
    const teacherRes = await authed(app, teacherCookie, 'get', '/api/v1/audit');
    expect(teacherRes.status).toBe(403);

    const studentRes = await authed(app, studentCookie, 'get', '/api/v1/audit');
    expect(studentRes.status).toBe(403);
  });
});

