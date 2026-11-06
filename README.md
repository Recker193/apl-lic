# High School Students' App

Backend REST for high-school teachers and students: groups per subject, announcements, assignments, exams, materials, in-app notifications, school events, and a calendar.

## Requirements

- Node.js 20+
- Docker Desktop
- npm

## Setup

```bash
copy .env.example .env
docker compose up -d
# PostgreSQL is published on localhost:5433 to avoid clashing with a local install on 5432
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

- API: http://localhost:3000/api/v1/health
- Swagger: http://localhost:3000/api/docs
- Mailhog: http://localhost:8025

Create the first school administrator (no hardcoded password):

```bash
npm run bootstrap:admin
```

Set `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, and `BOOTSTRAP_SCHOOL_NAME` in `.env` first. The command refuses to run if an admin already exists.

## Tests

```bash
npm test
npm run test:e2e
```

End-to-end tests use the `hssa_test` database defined in `.env.test` (created by `scripts/init-db.sql` on PostgreSQL port 5433).

## Auth

Invite-only registration, Argon2id passwords, HttpOnly session cookies, CSRF header `X-Requested-With: XMLHttpRequest` on authenticated mutations, and school-scoped authorization on every resource.

## Production / pilot

Containerised deployment (Postgres, NestJS, Caddy with automatic HTTPS, scheduled backups):

```bash
cp .env.prod.example .env.prod   # fill in every value
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Full installation, backup/restore and emergency procedures are in [docs/PILOT_RUNBOOK.md](docs/PILOT_RUNBOOK.md).

Production-related variables (see `.env.example` and `.env.prod.example`):

- `TRUST_PROXY` – number of trusted proxies (1 behind Caddy) so rate limiting sees the real client IP.
- `ENABLE_SWAGGER` – Swagger is off when `NODE_ENV=production` unless set to `true`.
- `COOKIE_SECURE=true` is mandatory when `NODE_ENV=production`.
- `LOG_LEVEL` – pino JSON log level.
- `MAIL_USER` / `MAIL_PASSWORD` – optional SMTP authentication.

Health endpoints: `/api/v1/health/liveness`, `/api/v1/health/readiness`, `/api/v1/health/metrics` (Prometheus text; blocked by the reverse proxy).

## Browser tests (Playwright)

```bash
cd web && npm run test:e2e:install   # one-time: downloads Chromium
cd .. && npm run test:e2e:ui
```

Needs PostgreSQL on port 5433 with the `hssa_test` database (`docker compose up -d postgres`). The run resets and seeds `hssa_test`, starts the backend on port 3100 and Vite on 5174, then exercises the auth, teacher, student and admin flows.
