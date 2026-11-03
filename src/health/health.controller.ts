import { Controller, Get, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { HealthService } from './health.service';

@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** Compatibilitate: verificare simplă de bază de date. */
  @Get()
  async check(@Res({ passthrough: true }) res: Response) {
    const database = await this.health.checkDatabase();
    if (database.status !== 'up') {
      res.status(503);
      return { status: 'unavailable' };
    }
    return { status: 'ok' };
  }

  /** Procesul rulează (nu atinge dependențe externe). */
  @Get('liveness')
  liveness() {
    return this.health.liveness();
  }

  /** Aplicația poate servi trafic: bază de date, storage, memorie. */
  @Get('readiness')
  async readiness(@Res({ passthrough: true }) res: Response) {
    const { ready, body } = await this.health.readiness();
    if (!ready) {
      res.status(503);
    }
    return body;
  }

  /** Metrici în format Prometheus; blocat la nivel de reverse proxy. */
  @Get('metrics')
  async metrics(@Res() res: Response) {
    res.type('text/plain; version=0.0.4').send(await this.health.metrics());
  }
}
