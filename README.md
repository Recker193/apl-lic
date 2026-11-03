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
