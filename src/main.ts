import { config } from 'dotenv';
import { createApp } from './create-app';
import { loadEnv } from './config/env';
import { PrismaService } from './prisma/prisma.service';
import { autoBootstrapAdmin } from './common/bootstrap/auto-bootstrap';

config();

async function bootstrap() {
  const app = await createApp();
  const env = loadEnv();

  const prisma = app.get(PrismaService);
  await autoBootstrapAdmin(prisma);

  await app.listen(env.port);
}

void bootstrap();
