const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
require('dotenv').config();

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const schoolName = process.env.BOOTSTRAP_SCHOOL_NAME;
  const firstName = process.env.BOOTSTRAP_ADMIN_FIRST_NAME ?? 'Admin';
  const lastName = process.env.BOOTSTRAP_ADMIN_LAST_NAME ?? 'School';

  if (!email || !password || !schoolName) {
    throw new Error(
      'BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD and BOOTSTRAP_SCHOOL_NAME are required',
    );
  }
  if (password.length < 10) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 10 characters');
  }

  const prisma = new PrismaClient();
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    if (existingAdmin) {
      throw new Error('An administrator already exists');
    }

    const passwordHash = await argon2.hash(password);
    const school = await prisma.school.create({
      data: { name: schoolName },
    });
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'ADMIN',
        schoolId: school.id,
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`Created school ${school.id} and admin ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
