import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  authed,
  createTestingApp,
  Fixture,
  login,
  sessionCookie,
} from './helpers';

describe('Calendar and events (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let fixture: Fixture;
  let adminCookie: string;
  let studentCookie: string;
  let studentBCookie: string;

  beforeAll(async () => {
    const ctx = await createTestingApp();
    app = ctx.app;
    prisma = ctx.prisma;
    fixture = ctx.fixture;
    adminCookie = sessionCookie(await login(app, fixture.adminA.email));
    studentCookie = sessionCookie(await login(app, fixture.studentA.email));
    studentBCookie = sessionCookie(await login(app, fixture.studentB.email));
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('lets an admin publish a school event visible in the calendar', async () => {
    const startsAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const endsAt = new Date(Date.now() + 26 * 3600 * 1000).toISOString();
    const created = await authed(app, adminCookie, 'post', '/api/v1/events').send({
      title: 'Olimpiada',
      description: 'Informatica',
      startsAt,
      endsAt,
    });
    expect(created.status).toBe(201);

    const from = new Date().toISOString();
    const to = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const calendar = await authed(
      app,
      studentCookie,
      'get',
      `/api/v1/calendar?from=${from}&to=${to}`,
    );
    expect(calendar.status).toBe(200);
    expect(calendar.body.events.some((e: { title: string }) => e.title === 'Olimpiada')).toBe(
      true,
    );
  });

  it('does not leak another school event by id', async () => {
    const event = await prisma.schoolEvent.findFirstOrThrow({
      where: { schoolId: fixture.schoolA.id },
    });
    const res = await authed(
      app,
      studentBCookie,
      'get',
      `/api/v1/events/${event.id}`,
    );
    expect(res.status).toBe(404);
  });
});
