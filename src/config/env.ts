export type AppEnv = {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  sessionSecret: string;
  cookieSecure: boolean;
  cookieName: string;
  sessionTtlHours: number;
  corsOrigins: string[];
  storageDir: string;
  maxUploadBytes: number;
  mailHost: string;
  mailPort: number;
  mailFrom: string;
  appBaseUrl: string;
  enableCron: boolean;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export function loadEnv(): AppEnv {
  const cors = process.env.CORS_ORIGINS ?? 'http://localhost:3000';
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    databaseUrl: required('DATABASE_URL'),
    sessionSecret: required('SESSION_SECRET'),
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    cookieName: process.env.COOKIE_NAME ?? 'hssa.sid',
    sessionTtlHours: Number(process.env.SESSION_TTL_HOURS ?? 12),
    corsOrigins: cors
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    storageDir: process.env.STORAGE_DIR ?? './storage/uploads',
    maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024),
    mailHost: process.env.MAIL_HOST ?? 'localhost',
    mailPort: Number(process.env.MAIL_PORT ?? 1025),
    mailFrom: process.env.MAIL_FROM ?? 'noreply@localhost',
    appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3000',
    enableCron: process.env.ENABLE_CRON === 'true',
  };
}
