import { INestApplication } from '@nestjs/common';
import { EmailTokenType, PrismaClient } from '@prisma/client';
import request from 'supertest';
import { generateOpaqueToken, hashToken } from '../src/common/crypto/tokens';
import {
  authed,
  createTestingApp,
  Fixture,
  login,
  sessionCookie,
  TEST_PASSWORD,
} from './helpers';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let fixture: Fixture;

  beforeAll(async () => {
    const ctx = await createTestingApp();
    app = ctx.app;
    prisma = ctx.prisma;
    fixture = ctx.fixture;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('logs in with valid credentials', async () => {
    const res = await login(app, fixture.studentA.email);
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('STUDENT');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects a wrong password', async () => {
    const res = await login(app, fixture.studentA.email, 'wrong-password');
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated private access', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user after login', async () => {
    const res = await login(app, fixture.teacherA.email);
    const cookie = sessionCookie(res);
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(fixture.teacherA.email);
  });

  it('logs out and revokes session', async () => {
    const loginRes = await login(app, fixture.teacherA.email);
    const cookie = sessionCookie(loginRes);

    const logoutRes = await authed(app, cookie, 'post', '/api/v1/auth/logout');
    expect(logoutRes.status).toBe(204);

    const meRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);
    expect(meRes.status).toBe(401);
  });

  it('ignores a self-assigned admin role on register', async () => {
    const adminLogin = await login(app, fixture.adminA.email);
    expect(adminLogin.status).toBe(200);
    const invite = await request(app.getHttpServer())
      .post('/api/v1/invitations')
      .set('Cookie', sessionCookie(adminLogin))
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        email: 'new.student@example.com',
        role: 'STUDENT',
        classId: fixture.classA.id,
      });
    expect(invite.status).toBe(201);
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        token: invite.body.token as string,
        password: TEST_PASSWORD,
        firstName: 'New',
        lastName: 'Student',
        role: 'ADMIN',
        schoolId: fixture.schoolB.id,
      });
    expect(register.status).toBe(201);
    const created = await prisma.user.findUniqueOrThrow({
      where: { email: 'new.student@example.com' },
    });
    expect(created.role).toBe('STUDENT');
    expect(created.schoolId).toBe(fixture.schoolA.id);
  });

  it('rejects register without a valid invitation', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        token: 'deadbeef',
        password: TEST_PASSWORD,
        firstName: 'X',
        lastName: 'Y',
      });
    expect(res.status).toBe(400);
  });

  it('handles forgot-password generically for existing and non-existing email', async () => {
    const res1 = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: fixture.studentA.email });
    expect(res1.status).toBe(204);

    const res2 = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' });
    expect(res2.status).toBe(204);
  });

  it('resets password successfully with valid token and rejects old password', async () => {
    const rawResetToken = generateOpaqueToken();
    await prisma.emailToken.create({
      data: {
        userId: fixture.studentA.id,
        type: EmailTokenType.RESET_PASSWORD,
        tokenHash: hashToken(rawResetToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetRes = await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({
        token: rawResetToken,
        password: 'NewStrongPassword123!',
      });
    expect(resetRes.status).toBe(204);

    const oldLogin = await login(app, fixture.studentA.email, TEST_PASSWORD);
    expect(oldLogin.status).toBe(401);

    const newLogin = await login(
      app,
      fixture.studentA.email,
      'NewStrongPassword123!',
    );
    expect(newLogin.status).toBe(200);
  });

  it('verifies email with verify-email token', async () => {
    const rawVerifyToken = generateOpaqueToken();
    const unverifiedUser = await prisma.user.create({
      data: {
        email: 'unverified@example.com',
        passwordHash: 'dummy-hash',
        firstName: 'Unverified',
        lastName: 'User',
        role: 'STUDENT',
        schoolId: fixture.schoolA.id,
        emailVerifiedAt: null,
      },
    });

    await prisma.emailToken.create({
      data: {
        userId: unverifiedUser.id,
        type: EmailTokenType.VERIFY_EMAIL,
        tokenHash: hashToken(rawVerifyToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const verifyRes = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({ token: rawVerifyToken });
    expect(verifyRes.status).toBe(204);

    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: unverifiedUser.id },
    });
    expect(updated.emailVerifiedAt).not.toBeNull();
  });
});
