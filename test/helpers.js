const { PrismaClient, UserRole, MembershipRole } = require('@prisma/client');
const argon2 = require('argon2');

const TEST_PASSWORD = 'Password123!';

async function resetDatabase(prisma) {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "AuditLog",
      "Notification",
      "AssignmentProgress",
      "Assignment",
      "Announcement",
      "Exam",
      "Material",
      "SchoolEvent",
      "GroupMembership",
      "Invitation",
      "EmailToken",
      "LoginAttempt",
      "Session",
      "ClassMembership",
      "SubjectGroup",
      "Subject",
      "SchoolClass",
      "User",
      "School",
      "Term",
      "GradeEntry",
      "GradeRevision",
      "Absence",
      "ConductGrade",
      "TermAverage",
      "HomeroomAssignment"
    RESTART IDENTITY CASCADE;
  `);
}

async function seedFixture(prisma) {
  const passwordHash = await argon2.hash(TEST_PASSWORD);
  const schoolA = await prisma.school.create({ data: { name: 'Liceul A' } });
  const schoolB = await prisma.school.create({ data: { name: 'Liceul B' } });

  const adminA = await prisma.user.create({
    data: {
      email: 'admin.a@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'A',
      role: UserRole.ADMIN,
      schoolId: schoolA.id,
      emailVerifiedAt: new Date(),
    },
  });
  const teacherA = await prisma.user.create({
    data: {
      email: 'teacher.a@example.com',
      passwordHash,
      firstName: 'Teacher',
      lastName: 'A',
      role: UserRole.TEACHER,
      schoolId: schoolA.id,
      emailVerifiedAt: new Date(),
    },
  });
  const studentA = await prisma.user.create({
    data: {
      email: 'student.a@example.com',
      passwordHash,
      firstName: 'Student',
      lastName: 'A',
      role: UserRole.STUDENT,
      schoolId: schoolA.id,
      emailVerifiedAt: new Date(),
    },
  });
  const studentPoster = await prisma.user.create({
    data: {
      email: 'poster.a@example.com',
      passwordHash,
      firstName: 'Poster',
      lastName: 'A',
      role: UserRole.STUDENT,
      schoolId: schoolA.id,
      emailVerifiedAt: new Date(),
    },
  });
  const teacherB = await prisma.user.create({
    data: {
      email: 'teacher.b@example.com',
      passwordHash,
      firstName: 'Teacher',
      lastName: 'B',
      role: UserRole.TEACHER,
      schoolId: schoolB.id,
      emailVerifiedAt: new Date(),
    },
  });
  const studentB = await prisma.user.create({
    data: {
      email: 'student.b@example.com',
      passwordHash,
      firstName: 'Student',
      lastName: 'B',
      role: UserRole.STUDENT,
      schoolId: schoolB.id,
      emailVerifiedAt: new Date(),
    },
  });

  const classA = await prisma.schoolClass.create({
    data: { name: 'IX A', schoolYear: '2026-2027', schoolId: schoolA.id },
  });
  await prisma.classMembership.create({
    data: { classId: classA.id, studentId: studentA.id },
  });
  await prisma.classMembership.create({
    data: { classId: classA.id, studentId: studentPoster.id },
  });
  const classB = await prisma.schoolClass.create({
    data: { name: 'IX B', schoolYear: '2026-2027', schoolId: schoolB.id },
  });
  const subjectA = await prisma.subject.create({
    data: { name: 'Informatica', schoolId: schoolA.id },
  });
  const subjectB = await prisma.subject.create({
    data: { name: 'Informatica', schoolId: schoolB.id },
  });
  const groupA = await prisma.subjectGroup.create({
    data: {
      name: 'Info IX A',
      subjectId: subjectA.id,
      classId: classA.id,
      teacherId: teacherA.id,
      schoolId: schoolA.id,
    },
  });
  const groupB = await prisma.subjectGroup.create({
    data: {
      name: 'Info IX B',
      subjectId: subjectB.id,
      classId: classB.id,
      teacherId: teacherB.id,
      schoolId: schoolB.id,
    },
  });

  await prisma.groupMembership.createMany({
    data: [
      {
        groupId: groupA.id,
        userId: teacherA.id,
        membershipRole: MembershipRole.TEACHER,
        canPost: true,
      },
      {
        groupId: groupA.id,
        userId: studentA.id,
        membershipRole: MembershipRole.STUDENT,
        canPost: false,
      },
      {
        groupId: groupA.id,
        userId: studentPoster.id,
        membershipRole: MembershipRole.STUDENT,
        canPost: true,
      },
      {
        groupId: groupB.id,
        userId: teacherB.id,
        membershipRole: MembershipRole.TEACHER,
        canPost: true,
      },
      {
        groupId: groupB.id,
        userId: studentB.id,
        membershipRole: MembershipRole.STUDENT,
        canPost: false,
      },
    ],
  });

  return {
    schoolA,
    schoolB,
    adminA,
    teacherA,
    studentA,
    studentPoster,
    studentB,
    teacherB,
    classA,
    subjectA,
    groupA,
    groupB,
  };
}

module.exports = {
  TEST_PASSWORD,
  resetDatabase,
  seedFixture,
};
