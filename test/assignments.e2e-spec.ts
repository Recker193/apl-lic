import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { NotificationsService } from '../src/notifications/notifications.service';
import {
  authed,
  createTestingApp,
  Fixture,
  login,
  sessionCookie,
} from './helpers';

describe('Assignments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let fixture: Fixture;
  let teacherCookie: string;
  let studentCookie: string;
  let assignmentId: string;

  beforeAll(async () => {
    const ctx = await createTestingApp();
    app = ctx.app;
    prisma = ctx.prisma;
    fixture = ctx.fixture;
    teacherCookie = sessionCookie(await login(app, fixture.teacherA.email));
    studentCookie = sessionCookie(await login(app, fixture.studentA.email));
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('lets an authorized teacher create an assignment', async () => {
    const dueAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    const res = await authed(
      app,
      teacherCookie,
      'post',
      `/api/v1/groups/${fixture.groupA.id}/assignments`,
    ).send({
      title: 'Tema 1',
      description: 'Rezolva exercitiile',
      dueAt,
    });
    expect(res.status).toBe(201);
    assignmentId = res.body.id as string;
    const notifications = await prisma.notification.findMany({
      where: { userId: fixture.studentA.id, resourceId: assignmentId },
    });
    expect(notifications.length).toBe(1);
  });

  it('does not let a student edit the assignment', async () => {
    const res = await authed(
      app,
      studentCookie,
      'patch',
      `/api/v1/assignments/${assignmentId}`,
    ).send({ title: 'Hacked' });
    expect(res.status).toBe(404);
  });

  it('lets a student update only their own progress', async () => {
    const mine = await authed(
      app,
      studentCookie,
      'patch',
      `/api/v1/assignments/${assignmentId}/progress/me`,
    ).send({ status: 'IN_PROGRESS' });
    expect(mine.status).toBe(200);
    expect(mine.body.studentId).toBe(fixture.studentA.id);
  });

  it('rejects a due date in the past', async () => {
    const res = await authed(
      app,
      teacherCookie,
      'post',
      `/api/v1/groups/${fixture.groupA.id}/assignments`,
    ).send({
      title: 'Late',
      description: 'x',
      dueAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(res.status).toBe(400);
  });

  it('does not duplicate due-soon notifications', async () => {
    const dueAt = new Date(Date.now() + 24 * 3600 * 1000);
    const assignment = await prisma.assignment.create({
      data: {
        groupId: fixture.groupA.id,
        schoolId: fixture.schoolA.id,
        authorId: fixture.teacherA.id,
        title: 'Soon',
        description: 'd',
        dueAt,
      },
    });
    const service = app.get(NotificationsService);
    const first = await service.sendDueReminders(new Date());
    const second = await service.sendDueReminders(new Date());
    expect(first).toBeGreaterThan(0);
    expect(second).toBe(0);
    const count = await prisma.notification.count({
      where: {
        resourceId: assignment.id,
        type: 'ASSIGNMENT_DUE_SOON',
      },
    });
    expect(count).toBeGreaterThan(0);
  });
});
