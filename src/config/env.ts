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
  mailUser?: string;
  mailPassword?: string;
  appBaseUrl: string;
  enableCron: boolean;
  trustProxy: boolean | number;
  enableSwagger: boolean;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

function parseTrustProxy(value: string | undefined): boolean | number {
  if (!value || value === 'false') return false;
  if (value === 'true') return true;
  const hops = Number(value);
  return Number.isInteger(hops) && hops >= 0 ? hops : false;
}

export function loadEnv(): AppEnv {
  const cors = process.env.CORS_ORIGINS ?? 'http://localhost:3000';
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const cookieSecure = process.env.COOKIE_SECURE === 'true';
  const cookieName = process.env.COOKIE_NAME ?? 'hssa.sid';
  if (nodeEnv === 'production' && !cookieSecure) {
    throw new Error('COOKIE_SECURE=true is required when NODE_ENV=production');
  }
  if (cookieName.startsWith('__Host-') && !cookieSecure) {
    throw new Error('A __Host- cookie name requires COOKIE_SECURE=true');
  }
  return {
    nodeEnv,
    port: Number(process.env.PORT ?? 3000),
    databaseUrl: required('DATABASE_URL'),
    sessionSecret: required('SESSION_SECRET'),
    cookieSecure,
    cookieName,
    sessionTtlHours: Number(process.env.SESSION_TTL_HOURS ?? 12),
    corsOrigins: cors
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    storageDir: process.env.STORAGE_DIR ?? './storage/uploads',
    maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024),
    mailHost: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    mailPort: Number(process.env.MAIL_PORT ?? 587),
    // MAIL_PASS este acceptat ca alias: unele template-uri de deploy (Render,
    // Railway) folosesc numele acesta, iar fără el autentificarea SMTP lipsea
    // în tăcere și Gmail respingea trimiterea.
    mailPassword: firstNonEmpty(
      process.env.MAIL_PASSWORD,
      process.env.MAIL_PASS,
    ),
    mailUser: firstNonEmpty(process.env.MAIL_USER) ?? 'no.reply.oktapod@gmail.com',
    // Gmail (și majoritatea providerilor) respinge mesajele al căror expeditor
    // nu aparține contului autentificat; dacă MAIL_FROM nu e setat folosim
    // adresa contului SMTP configurat (no.reply.oktapod@gmail.com).
    mailFrom: firstNonEmpty(process.env.MAIL_FROM) ??
      firstNonEmpty(process.env.MAIL_USER) ??
      'no.reply.oktapod@gmail.com',
    appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3000',
    enableCron: process.env.ENABLE_CRON === 'true',
    trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
    enableSwagger:
      nodeEnv !== 'production' || process.env.ENABLE_SWAGGER === 'true',
  };
}
