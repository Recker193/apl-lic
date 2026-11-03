import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createTestingApp } from './helpers';

describe('Health (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const ctx = await createTestingApp();
    app = ctx.app;
    prisma = ctx.prisma;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('returns ok when the database is reachable', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('liveness does not touch dependencies', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/health/liveness',
    );
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });

  it('readiness reports database, storage and memory', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/health/readiness',
    );
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.checks.database.status).toBe('up');
    expect(res.body.checks.storage.status).toBe('up');
    expect(res.body.checks.memory.status).toBe('up');
  });

  it('metrics are exposed in Prometheus text format', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/health/metrics',
    );
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('hssa_database_up 1');
  });
});
