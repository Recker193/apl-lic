const { config } = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { resetDatabase, seedFixture } = require('./helpers');

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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
