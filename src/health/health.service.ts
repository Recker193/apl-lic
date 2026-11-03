import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { getHeapStatistics } from 'v8';
import { loadEnv } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

export type CheckResult = {
  status: 'up' | 'down';
  latencyMs?: number;
  detail?: Record<string, number | string>;
  error?: string;
};

const HEAP_USAGE_LIMIT = 0.92;

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkDatabase(): Promise<CheckResult> {
    const startedAt = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - startedAt };
    } catch {
      return { status: 'down', error: 'database unreachable' };
    }
  }

  async checkStorage(): Promise<CheckResult> {
    const startedAt = Date.now();
    const dir = loadEnv().storageDir;
    const probe = join(dir, `.health-${randomUUID()}`);
    const payload = randomUUID();
    try {
      await mkdir(dir, { recursive: true });
      await writeFile(probe, payload, { mode: 0o600 });
      const read = await readFile(probe, 'utf8');
      await unlink(probe);
      if (read !== payload) {
        return { status: 'down', error: 'storage read-back mismatch' };
      }
      return { status: 'up', latencyMs: Date.now() - startedAt };
    } catch {
      return { status: 'down', error: 'storage not writable' };
    }
  }

  checkMemory(): CheckResult {
    const usage = process.memoryUsage();
    const limit = getHeapStatistics().heap_size_limit;
    const ratio = usage.heapUsed / limit;
    return {
      status: ratio > HEAP_USAGE_LIMIT ? 'down' : 'up',
      detail: {
        rssMb: Math.round(usage.rss / 1024 / 1024),
        heapUsedMb: Math.round(usage.heapUsed / 1024 / 1024),
        heapLimitMb: Math.round(limit / 1024 / 1024),
      },
    };
  }

  async readiness() {
    const [database, storage] = await Promise.all([
      this.checkDatabase(),
      this.checkStorage(),
    ]);
    const memory = this.checkMemory();
    const checks = { database, storage, memory };
    const ready = Object.values(checks).every((c) => c.status === 'up');
    return { ready, body: { status: ready ? 'ok' : 'unavailable', checks } };
  }

  liveness() {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  async metrics(): Promise<string> {
    const database = await this.checkDatabase();
    const usage = process.memoryUsage();
    const lines = [
      '# TYPE hssa_process_uptime_seconds gauge',
      `hssa_process_uptime_seconds ${Math.round(process.uptime())}`,
      '# TYPE hssa_process_resident_memory_bytes gauge',
      `hssa_process_resident_memory_bytes ${usage.rss}`,
      '# TYPE hssa_process_heap_used_bytes gauge',
      `hssa_process_heap_used_bytes ${usage.heapUsed}`,
      '# TYPE hssa_database_up gauge',
      `hssa_database_up ${database.status === 'up' ? 1 : 0}`,
      '# TYPE hssa_database_latency_ms gauge',
      `hssa_database_latency_ms ${database.latencyMs ?? -1}`,
    ];
    return `${lines.join('\n')}\n`;
  }
}
