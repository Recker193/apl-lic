const { config } = require('dotenv');
const argon2 = require('argon2');
const { PrismaClient, UserRole, MembershipRole } = require('@prisma/client');

config();

async function main() {
  if (process.env.NODE_ENV !== 'development') {
    console.log('Skipping seed: NODE_ENV is not development');
    return;
  }

  const prisma = new PrismaClient();
  try {
    const existingSchool = await prisma.school.findFirst({
      where: { name: 'Liceul Teoretic de Dezvoltare' },
    });
    if (existingSchool) {
      console.log('Seed already applied. Skipping.');
      return;
    }

    const defaultPassword = process.env.DEV_SEED_PASSWORD ?? 'DevPassword123!';
    const passwordHash = await argon2.hash(defaultPassword);

    const school = await prisma.school.create({
      data: { name: 'Liceul Teoretic de Dezvoltare' },
    });

    const admin = await prisma.user.create({
      data: {
        email: 'admin.dev@example.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'Dev',
        role: UserRole.ADMIN,
        schoolId: school.id,
        emailVerifiedAt: new Date(),
      },
    });

    const teacher = await prisma.user.create({
      data: {
        email: 'profesor.dev@example.com',
        passwordHash,
        firstName: 'Profesor',
        lastName: 'Popescu',
        role: UserRole.TEACHER,
        schoolId: school.id,
        emailVerifiedAt: new Date(),
      },
    });

    const student = await prisma.user.create({
      data: {
        email: 'elev.dev@example.com',
        passwordHash,
        firstName: 'Elev',
        lastName: 'Ionescu',
        role: UserRole.STUDENT,
        schoolId: school.id,
        emailVerifiedAt: new Date(),
      },
    });

    const schoolClass = await prisma.schoolClass.create({
      data: {
        name: 'Clasa a X-a A',
        schoolYear: '2026-2027',
        schoolId: school.id,
      },
    });

    await prisma.classMembership.create({
      data: {
        classId: schoolClass.id,
        studentId: student.id,
      },
    });

    const subject = await prisma.subject.create({
      data: {
        name: 'Informatică',
        schoolId: school.id,
      },
    });

    const group = await prisma.subjectGroup.create({
      data: {
        name: 'Informatică X-A',
        schoolId: school.id,
        subjectId: subject.id,
        classId: schoolClass.id,
        teacherId: teacher.id,
      },
    });

    await prisma.groupMembership.createMany({
      data: [
        {
          groupId: group.id,
          userId: teacher.id,
          membershipRole: MembershipRole.TEACHER,
          canPost: true,
        },
        {
          groupId: group.id,
          userId: student.id,
          membershipRole: MembershipRole.STUDENT,
          canPost: true,
        },
      ],
    });

    console.log('Development seed created successfully for school:', school.name);
    console.log('Users created:');
    console.log(' - Admin:', admin.email);
    console.log(' - Teacher:', teacher.email);
    console.log(' - Student:', student.email);
  } finally {
    await prisma.$disconnect();
  }
}

main();
