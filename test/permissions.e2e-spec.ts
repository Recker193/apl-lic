import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  authed,
  createTestingApp,
  Fixture,
  login,
  sessionCookie,
} from './helpers';

describe('Permissions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let fixture: Fixture;
  let studentCookie: string;
  let posterCookie: string;
  let teacherCookie: string;
  let teacherBCookie: string;
  let studentBCookie: string;

  beforeAll(async () => {
    const ctx = await createTestingApp();
    app = ctx.app;
    prisma = ctx.prisma;
    fixture = ctx.fixture;
    studentCookie = sessionCookie(await login(app, fixture.studentA.email));
    posterCookie = sessionCookie(await login(app, fixture.studentPoster.email));
    teacherCookie = sessionCookie(await login(app, fixture.teacherA.email));
    teacherBCookie = sessionCookie(await login(app, fixture.teacherB.email));
    studentBCookie = sessionCookie(await login(app, fixture.studentB.email));
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('lets a student read announcements in their group', async () => {
    await authed(
      app,
      teacherCookie,
      'post',
      `/api/v1/groups/${fixture.groupA.id}/announcements`,
    ).send({ title: 'Hello', content: 'World' });
    const res = await authed(
      app,
      studentCookie,
      'get',
      `/api/v1/groups/${fixture.groupA.id}/announcements`,
    );
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('blocks a student without canPost from publishing', async () => {
    const res = await authed(
      app,
      studentCookie,
      'post',
      `/api/v1/groups/${fixture.groupA.id}/announcements`,
    ).send({ title: 'Nope', content: 'Nope' });
    expect(res.status).toBe(403);
  });

  it('lets an authorized student publish', async () => {
    const res = await authed(
      app,
      posterCookie,
      'post',
      `/api/v1/groups/${fixture.groupA.id}/announcements`,
    ).send({ title: 'From student', content: 'Allowed' });
    expect(res.status).toBe(201);
  });

  it('lets the teacher change canPost', async () => {
    const res = await authed(
      app,
      teacherCookie,
      'patch',
      `/api/v1/groups/${fixture.groupA.id}/members/${fixture.studentA.id}/permissions`,
    ).send({ canPost: true });
    expect(res.status).toBe(200);
    expect(res.body.canPost).toBe(true);
  });

  it('does not let a teacher administer another school group', async () => {
    const res = await authed(
      app,
      teacherBCookie,
      'patch',
      `/api/v1/groups/${fixture.groupA.id}/members/${fixture.studentA.id}/permissions`,
    ).send({ canPost: false });
    expect(res.status).toBe(404);
  });

  it('allows teacher or admin to PATCH group name', async () => {
    const res = await authed(
      app,
      teacherCookie,
      'patch',
      `/api/v1/groups/${fixture.groupA.id}`,
    ).send({ name: 'Math Advanced Updated' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Math Advanced Updated');
  });

  it('forbids student from PATCH group', async () => {
    const res = await authed(
      app,
      studentCookie,
      'patch',
      `/api/v1/groups/${fixture.groupA.id}`,
    ).send({ name: 'Hacked Name' });
    expect(res.status).toBe(403);
  });

  it('isolates private data between schools', async () => {
    const res = await authed(
      app,
      studentBCookie,
      'get',
      `/api/v1/groups/${fixture.groupA.id}`,
    );
    expect(res.status).toBe(404);
  });
});
