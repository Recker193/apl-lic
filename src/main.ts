import { config } from 'dotenv';
import { createApp } from './create-app';
import { loadEnv } from './config/env';

config();

async function bootstrap() {
  const app = await createApp();
  const env = loadEnv();
  await app.listen(env.port);
}

void bootstrap();
