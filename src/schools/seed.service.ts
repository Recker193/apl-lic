import { Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import { DayOfWeek, MembershipRole, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/types/authenticated-user';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generează date placeholder demonstrative pentru școala curentă,
   * FĂRĂ a atinge conturile existente ale utilizatorilor reali.
   */
  async seedPlaceholdersForSchool(actor: AuthenticatedUser) {
    const schoolId = actor.schoolId;
    const defaultPasswordHash = await argon2.hash('Placeholder123!');

    // 1. Asigurare Trimestru / Modul deschis pentru note și absențe
    const existingTerms = await this.prisma.term.count({ where: { schoolId } });
    if (existingTerms === 0) {
      const now = new Date();
      await this.prisma.term.create({
        data: {
          schoolId,
          schoolYear: '2026-2027',
          number: 1,
          status: 'OPEN',
          startsAt: new Date(now.getFullYear(), 8, 1),
          endsAt: new Date(now.getFullYear() + 1, 5, 30),
        },
      });
      this.logger.log(`Creat semestru/modul 1 pentru școala ${schoolId}`);
    }

    // 2. Clase Placeholder
    const placeholderClassesData = [
      { name: 'X-A', schoolYear: '2026-2027' },
      { name: 'X-B', schoolYear: '2026-2027' },
      { name: 'XI-A', schoolYear: '2026-2027' },
      { name: 'XII-B', schoolYear: '2026-2027' },
    ];

    const classesMap = new Map<string, string>();
    for (const c of placeholderClassesData) {
      let cls = await this.prisma.schoolClass.findFirst({
        where: { schoolId, name: c.name, schoolYear: c.schoolYear },
      });
      if (!cls) {
        cls = await this.prisma.schoolClass.create({
          data: {
            schoolId,
            name: c.name,
            schoolYear: c.schoolYear,
          },
        });
      }
      classesMap.set(c.name, cls.id);
    }

    // 3. Profesori Placeholder (nume românești verosimile, email placeholder)
    const placeholderTeachersData = [
      { firstName: 'Costel', lastName: 'Chiteș', email: `costel.chites.placeholder@${schoolId.slice(0, 6)}.lic` },
      { firstName: 'Irina', lastName: 'Tudorașcu', email: `irina.tudorascu.placeholder@${schoolId.slice(0, 6)}.lic` },
      { firstName: 'Mirela', lastName: 'Marcu', email: `mirela.marcu.placeholder@${schoolId.slice(0, 6)}.lic` },
      { firstName: 'Silvia', lastName: 'Măgureanu', email: `silvia.magureanu.placeholder@${schoolId.slice(0, 6)}.lic` },
      { firstName: 'Dan', lastName: 'Ciupercă', email: `dan.ciuperca.placeholder@${schoolId.slice(0, 6)}.lic` },
      { firstName: 'Oana-Maria', lastName: 'Lupașcu', email: `oana.lupascu.placeholder@${schoolId.slice(0, 6)}.lic` },
    ];

    const teacherIds: string[] = [];
    for (const t of placeholderTeachersData) {
      let teacher = await this.prisma.user.findUnique({
        where: { email: t.email },
      });
      if (!teacher) {
        teacher = await this.prisma.user.create({
          data: {
            email: t.email,
            passwordHash: defaultPasswordHash,
            firstName: t.firstName,
            lastName: t.lastName,
            role: UserRole.TEACHER,
            schoolId,
            isActive: true,
            emailVerifiedAt: new Date(),
          },
        });
      }
      teacherIds.push(teacher.id);
    }

    // 4. Elevi Placeholder (nume generate, fără a interfera cu conturile reale)
    const placeholderStudentsData = [
      { firstName: 'Andrei', lastName: 'Popa', email: `andrei.popa.demo@${schoolId.slice(0, 6)}.lic`, classKey: 'X-A' },
      { firstName: 'Maria', lastName: 'Radu', email: `maria.radu.demo@${schoolId.slice(0, 6)}.lic`, classKey: 'X-A' },
      { firstName: 'Mihai', lastName: 'Dumitrescu', email: `mihai.dumitrescu.demo@${schoolId.slice(0, 6)}.lic`, classKey: 'X-A' },
      { firstName: 'Elena', lastName: 'Ionescu', email: `elena.ionescu.demo@${schoolId.slice(0, 6)}.lic`, classKey: 'X-A' },
      { firstName: 'Vlad', lastName: 'Stoica', email: `vlad.stoica.demo@${schoolId.slice(0, 6)}.lic`, classKey: 'X-B' },
      { firstName: 'Ioana', lastName: 'Constantin', email: `ioana.constantin.demo@${schoolId.slice(0, 6)}.lic`, classKey: 'X-B' },
      { firstName: 'Alexandru', lastName: 'Stan', email: `alexandru.stan.demo@${schoolId.slice(0, 6)}.lic`, classKey: 'XI-A' },
      { firstName: 'Diana', lastName: 'Gheorghiu', email: `diana.gheorghiu.demo@${schoolId.slice(0, 6)}.lic`, classKey: 'XII-B' },
    ];

    const studentMap = new Map<string, string>();
    for (const s of placeholderStudentsData) {
      let student = await this.prisma.user.findUnique({
        where: { email: s.email },
      });
      if (!student) {
        student = await this.prisma.user.create({
          data: {
            email: s.email,
            passwordHash: defaultPasswordHash,
            firstName: s.firstName,
            lastName: s.lastName,
            role: UserRole.STUDENT,
            schoolId,
            isActive: true,
            emailVerifiedAt: new Date(),
          },
        });
      }
      studentMap.set(s.email, student.id);

      // Înscrie elevul în clasa respectivă dacă nu e deja înscris
      const classId = classesMap.get(s.classKey);
      if (classId) {
        const hasMembership = await this.prisma.classMembership.findFirst({
          where: { studentId: student.id, classId },
        });
        if (!hasMembership) {
          await this.prisma.classMembership.create({
            data: { studentId: student.id, classId },
          });
        }
      }
    }

    // 5. Materii Placeholder
    const placeholderSubjects = [
      'Matematică',
      'Fizică',
      'Chimie',
      'Informatică',
      'Limba și literatura română',
      'Limba engleză',
      'Istorie',
      'Biologie',
      'Geografie',
    ];

    const subjectMap = new Map<string, string>();
    for (const subName of placeholderSubjects) {
      let subj = await this.prisma.subject.findFirst({
        where: { schoolId, name: subName },
      });
      if (!subj) {
        subj = await this.prisma.subject.create({
          data: { schoolId, name: subName },
        });
      }
      subjectMap.set(subName, subj.id);
    }

    // 6. Grupe de studiu (SubjectGroup) & Înrolare elevi în grupuri
    const primaryClassId = classesMap.get('X-A')!;
    const subjectList = Array.from(subjectMap.entries());

    for (let i = 0; i < subjectList.length; i++) {
      const [sName, sId] = subjectList[i];
      const assignedTeacherId = teacherIds[i % teacherIds.length];

      let group = await this.prisma.subjectGroup.findFirst({
        where: { schoolId, subjectId: sId, classId: primaryClassId },
      });

      if (!group) {
        group = await this.prisma.subjectGroup.create({
          data: {
            schoolId,
            subjectId: sId,
            classId: primaryClassId,
            teacherId: assignedTeacherId,
            name: `${sName} - X-A`,
          },
        });
      }

      // Înrolare profesor
      await this.prisma.groupMembership.upsert({
        where: { groupId_userId: { groupId: group.id, userId: assignedTeacherId } },
        update: {},
        create: {
          groupId: group.id,
          userId: assignedTeacherId,
          membershipRole: MembershipRole.TEACHER,
          canPost: true,
        },
      });

      // Înrolare elevi din clasa X-A
      const classStudents = await this.prisma.classMembership.findMany({
        where: { classId: primaryClassId },
      });
      for (const cs of classStudents) {
        await this.prisma.groupMembership.upsert({
          where: { groupId_userId: { groupId: group.id, userId: cs.studentId } },
          update: {},
          create: {
            groupId: group.id,
            userId: cs.studentId,
            membershipRole: MembershipRole.STUDENT,
            canPost: false,
          },
        });
      }
    }

    // 7. Orar Placeholder complet (Luni - Vineri pentru clasa X-A)
    const primaryClassObj = await this.prisma.schoolClass.findUnique({
      where: { id: primaryClassId },
    });
    if (primaryClassObj) {
      const timetableSlots: { day: DayOfWeek; period: number; subject: string; teacherIdx: number; time: [string, string] }[] = [
        { day: DayOfWeek.MONDAY, period: 1, subject: 'Matematică', teacherIdx: 0, time: ['08:00', '08:50'] },
        { day: DayOfWeek.MONDAY, period: 2, subject: 'Informatică', teacherIdx: 1, time: ['09:00', '09:50'] },
        { day: DayOfWeek.MONDAY, period: 3, subject: 'Limba și literatura română', teacherIdx: 2, time: ['10:00', '10:50'] },
        { day: DayOfWeek.MONDAY, period: 4, subject: 'Fizică', teacherIdx: 3, time: ['11:00', '11:50'] },
        { day: DayOfWeek.TUESDAY, period: 1, subject: 'Chimie', teacherIdx: 4, time: ['08:00', '08:50'] },
        { day: DayOfWeek.TUESDAY, period: 2, subject: 'Biologie', teacherIdx: 5, time: ['09:00', '09:50'] },
        { day: DayOfWeek.TUESDAY, period: 3, subject: 'Matematică', teacherIdx: 0, time: ['10:00', '10:50'] },
        { day: DayOfWeek.WEDNESDAY, period: 1, subject: 'Limba engleză', teacherIdx: 3, time: ['08:00', '08:50'] },
        { day: DayOfWeek.WEDNESDAY, period: 2, subject: 'Istorie', teacherIdx: 4, time: ['09:00', '09:50'] },
        { day: DayOfWeek.WEDNESDAY, period: 3, subject: 'Geografie', teacherIdx: 5, time: ['10:00', '10:50'] },
        { day: DayOfWeek.THURSDAY, period: 1, subject: 'Fizică', teacherIdx: 3, time: ['08:00', '08:50'] },
        { day: DayOfWeek.THURSDAY, period: 2, subject: 'Informatică', teacherIdx: 1, time: ['09:00', '09:50'] },
        { day: DayOfWeek.FRIDAY, period: 1, subject: 'Limba și literatura română', teacherIdx: 2, time: ['08:00', '08:50'] },
        { day: DayOfWeek.FRIDAY, period: 2, subject: 'Matematică', teacherIdx: 0, time: ['09:00', '09:50'] },
      ];

      for (const slot of timetableSlots) {
        const subjId = subjectMap.get(slot.subject);
        const tId = teacherIds[slot.teacherIdx % teacherIds.length];
        if (subjId && tId) {
          const exists = await this.prisma.timetableEntry.findFirst({
            where: {
              classId: primaryClassId,
              dayOfWeek: slot.day,
              period: slot.period,
            },
          });
          if (!exists) {
            await this.prisma.timetableEntry.create({
              data: {
                schoolId,
                classId: primaryClassId,
                subjectId: subjId,
                teacherId: tId,
                dayOfWeek: slot.day,
                period: slot.period,
                startTime: slot.time[0],
                endTime: slot.time[1],
                room: `Sala ${10 + slot.period}`,
              },
            });
          }
        }
      }
    }

    return {
      success: true,
      message: 'Profiluri placeholder generate cu succes (clase, orar, elevi, profesori, materii). Conturile existente nu au fost atinse.',
    };
  }
}

