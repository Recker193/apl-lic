-- CreateEnum
CREATE TYPE "TermStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "GradeType" AS ENUM ('ORAL', 'TEST', 'HOMEWORK', 'PROJECT', 'THESIS');

-- CreateEnum
CREATE TYPE "GradeStatus" AS ENUM ('ACTIVE', 'VOIDED');

-- CreateEnum
CREATE TYPE "AbsenceStatus" AS ENUM ('UNEXCUSED', 'EXCUSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'GRADE_ADDED';
ALTER TYPE "NotificationType" ADD VALUE 'GRADE_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'ABSENCE_RECORDED';
ALTER TYPE "NotificationType" ADD VALUE 'TERM_CLOSED';

-- CreateTable
CREATE TABLE "Term" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "TermStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeEntry" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "type" "GradeType" NOT NULL,
    "value" INTEGER NOT NULL,
    "gradedAt" TIMESTAMP(3) NOT NULL,
    "comment" TEXT,
    "status" "GradeStatus" NOT NULL DEFAULT 'ACTIVE',
    "voidedReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeRevision" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "previousValue" INTEGER,
    "newValue" INTEGER,
    "previousStatus" "GradeStatus",
    "newStatus" "GradeStatus",
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absence" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "groupId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AbsenceStatus" NOT NULL DEFAULT 'UNEXCUSED',
    "excuseReason" TEXT,
    "excusedById" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConductGrade" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "setById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConductGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermAverage" (
    "id" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "average" DOUBLE PRECISION NOT NULL,
    "thesis" INTEGER,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermAverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeroomAssignment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeroomAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Term_schoolId_idx" ON "Term"("schoolId");

-- CreateIndex
CREATE INDEX "Term_status_idx" ON "Term"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Term_schoolId_schoolYear_number_key" ON "Term"("schoolId", "schoolYear", "number");

-- CreateIndex
CREATE INDEX "GradeEntry_studentId_termId_idx" ON "GradeEntry"("studentId", "termId");

-- CreateIndex
CREATE INDEX "GradeEntry_groupId_termId_idx" ON "GradeEntry"("groupId", "termId");

-- CreateIndex
CREATE INDEX "GradeEntry_schoolId_idx" ON "GradeEntry"("schoolId");

-- CreateIndex
CREATE INDEX "GradeRevision_gradeId_idx" ON "GradeRevision"("gradeId");

-- CreateIndex
CREATE INDEX "GradeRevision_actorId_idx" ON "GradeRevision"("actorId");

-- CreateIndex
CREATE INDEX "Absence_studentId_date_idx" ON "Absence"("studentId", "date");

-- CreateIndex
CREATE INDEX "Absence_schoolId_idx" ON "Absence"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Absence_studentId_groupId_date_key" ON "Absence"("studentId", "groupId", "date");

-- CreateIndex
CREATE INDEX "ConductGrade_schoolId_idx" ON "ConductGrade"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ConductGrade_termId_studentId_key" ON "ConductGrade"("termId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TermAverage_termId_groupId_studentId_key" ON "TermAverage"("termId", "groupId", "studentId");

-- CreateIndex
CREATE INDEX "HomeroomAssignment_schoolId_idx" ON "HomeroomAssignment"("schoolId");

-- CreateIndex
CREATE INDEX "HomeroomAssignment_teacherId_idx" ON "HomeroomAssignment"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "HomeroomAssignment_classId_schoolYear_key" ON "HomeroomAssignment"("classId", "schoolYear");

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeEntry" ADD CONSTRAINT "GradeEntry_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeEntry" ADD CONSTRAINT "GradeEntry_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeEntry" ADD CONSTRAINT "GradeEntry_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SubjectGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeEntry" ADD CONSTRAINT "GradeEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeEntry" ADD CONSTRAINT "GradeEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeRevision" ADD CONSTRAINT "GradeRevision_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "GradeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeRevision" ADD CONSTRAINT "GradeRevision_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SubjectGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_excusedById_fkey" FOREIGN KEY ("excusedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConductGrade" ADD CONSTRAINT "ConductGrade_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConductGrade" ADD CONSTRAINT "ConductGrade_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConductGrade" ADD CONSTRAINT "ConductGrade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConductGrade" ADD CONSTRAINT "ConductGrade_setById_fkey" FOREIGN KEY ("setById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermAverage" ADD CONSTRAINT "TermAverage_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermAverage" ADD CONSTRAINT "TermAverage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SubjectGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermAverage" ADD CONSTRAINT "TermAverage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeroomAssignment" ADD CONSTRAINT "HomeroomAssignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeroomAssignment" ADD CONSTRAINT "HomeroomAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeroomAssignment" ADD CONSTRAINT "HomeroomAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
