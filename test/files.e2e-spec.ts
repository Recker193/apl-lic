import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import {
  authed,
  createTestingApp,
  Fixture,
  login,
  sessionCookie,
} from './helpers';

describe('Files (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let fixture: Fixture;
  let teacherCookie: string;
  let studentBCookie: string;

  beforeAll(async () => {
    const ctx = await createTestingApp();
    app = ctx.app;
    prisma = ctx.prisma;
    fixture = ctx.fixture;
    teacherCookie = sessionCookie(await login(app, fixture.teacherA.email));
    studentBCookie = sessionCookie(await login(app, fixture.studentB.email));
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('rejects a disallowed file type', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/groups/${fixture.groupA.id}/materials`)
      .set('Cookie', teacherCookie)
      .set('X-Requested-With', 'XMLHttpRequest')
      .field('title', 'Bad')
      .attach('file', Buffer.from('MZ'), {
        filename: 'virus.exe',
        contentType: 'application/x-msdownload',
      });
    expect(res.status).toBe(400);
  });

  it('rejects an executable renamed to .pdf (magic bytes mismatch)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/groups/${fixture.groupA.id}/materials`)
      .set('Cookie', teacherCookie)
      .set('X-Requested-With', 'XMLHttpRequest')
      .field('title', 'Disguised')
      .attach('file', Buffer.from('MZ\x90\x00\x03\x00'), {
        filename: 'notes.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(400);
  });

  it('serves downloads as attachments with nosniff', async () => {
    const created = await request(app.getHttpServer())
      .post(`/api/v1/groups/${fixture.groupA.id}/materials`)
      .set('Cookie', teacherCookie)
      .set('X-Requested-With', 'XMLHttpRequest')
      .field('title', 'Headers')
      .attach('file', Buffer.from('%PDF-1.4 headers'), {
        filename: 'headers.pdf',
        contentType: 'application/pdf',
      });
    expect(created.status).toBe(201);
    const res = await authed(
      app,
      teacherCookie,
      'get',
      `/api/v1/materials/${created.body.id as string}/file`,
    );
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/^attachment/);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('rejects a file that is too large', async () => {
    const big = Buffer.alloc(11 * 1024 * 1024, 1);
    const res = await request(app.getHttpServer())
      .post(`/api/v1/groups/${fixture.groupA.id}/materials`)
      .set('Cookie', teacherCookie)
      .set('X-Requested-With', 'XMLHttpRequest')
      .field('title', 'Huge')
      .attach('file', big, {
        filename: 'huge.pdf',
        contentType: 'application/pdf',
      });
    expect([400, 413]).toContain(res.status);
  });

  it('prevents another school from downloading a private file', async () => {
    const created = await request(app.getHttpServer())
      .post(`/api/v1/groups/${fixture.groupA.id}/materials`)
      .set('Cookie', teacherCookie)
      .set('X-Requested-With', 'XMLHttpRequest')
      .field('title', 'Notes')
      .attach('file', Buffer.from('%PDF-1.4 test'), {
        filename: 'notes.pdf',
        contentType: 'application/pdf',
      });
    expect(created.status).toBe(201);
    const res = await authed(
      app,
      studentBCookie,
      'get',
      `/api/v1/materials/${created.body.id as string}/file`,
    );
    expect(res.status).toBe(404);
  });
});
