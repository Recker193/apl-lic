import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { resetDatabase, seedFixture } from './helpers';

/**
 * Pregătește baza `hssa_test` pentru testele Playwright (web/tests/e2e):
 * șterge tot și inserează aceleași date ca testele backend (Liceul A/B,
 * admin.a / teacher.a / student.a / poster.a / student.b @example.com,
 * parola Password123!). Rulează doar pe o bază cu "test" în nume.
 */
config({ path: '.env.test', override: true });

async function main() {
  const url = process.env.DATABASE_URL ?? '';
  if (!/_test(\?|$)/.test(url)) {
    throw new Error('Refuz să șterg o bază care nu se termină în _test');
  }
  const prisma = new PrismaClient();
  try {
    await resetDatabase(prisma);
    const fixture = await seedFixture(prisma);
    console.log(
      JSON.stringify({ groupA: fixture.groupA.id, groupB: fixture.groupB.id }),
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
