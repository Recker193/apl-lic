import * as argon2 from 'argon2';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export async function autoBootstrapAdmin(prisma: PrismaService): Promise<void> {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim();
  const schoolName = process.env.BOOTSTRAP_SCHOOL_NAME?.trim();
  const firstName = process.env.BOOTSTRAP_ADMIN_FIRST_NAME?.trim() || 'Admin';
  const lastName = process.env.BOOTSTRAP_ADMIN_LAST_NAME?.trim() || 'School';

  if (!email || !password || !schoolName) {
    return;
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });

  if (existingAdmin) {
    return;
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
      role: UserRole.ADMIN,
      schoolId: school.id,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`[BOOTSTRAP] Successfully initialized school (${school.name}) and admin (${email})`);
}

