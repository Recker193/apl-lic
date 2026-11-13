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
    const sid = schoolId.slice(0, 8);

    // 1. Asigurare Trimestru / Modul deschis
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
    }

    // 2. Clase Placeholder
    const placeholderClassesData = [
      { name: '10-E', schoolYear: '2026-2027' },
      { name: '10-F', schoolYear: '2026-2027' },
      { name: '11-C', schoolYear: '2026-2027' },
      { name: '12-A', schoolYear: '2026-2027' },
    ];

    const classesMap = new Map<string, string>();
    for (const c of placeholderClassesData) {
      let cls = await this.prisma.schoolClass.findFirst({
        where: { schoolId, name: c.name, schoolYear: c.schoolYear },
      });
      if (!cls) {
        cls = await this.prisma.schoolClass.create({
          data: { schoolId, name: c.name, schoolYear: c.schoolYear },
        });
      }
      classesMap.set(c.name, cls.id);
    }

    // 3. Profesori Placeholder — 12 profesori cu nume românești
    const placeholderTeachersData = [
      { firstName: 'Mihaela',  lastName: 'Dumitrescu',  email: `mihaela.dumitrescu.ph@${sid}.lic` },
      { firstName: 'Gheorghe', lastName: 'Popescu',      email: `gheorghe.popescu.ph@${sid}.lic` },
      { firstName: 'Adina',    lastName: 'Florescu',     email: `adina.florescu.ph@${sid}.lic` },
      { firstName: 'Corneliu', lastName: 'Mărăcineanu',  email: `corneliu.maracineanu.ph@${sid}.lic` },
      { firstName: 'Ileana',   lastName: 'Ciobanu',      email: `ileana.ciobanu.ph@${sid}.lic` },
      { firstName: 'Sorin',    lastName: 'Niculescu',    email: `sorin.niculescu.ph@${sid}.lic` },
      { firstName: 'Daniela',  lastName: 'Voinea',       email: `daniela.voinea.ph@${sid}.lic` },
      { firstName: 'Marian',   lastName: 'Gheorghiță',   email: `marian.gheorghita.ph@${sid}.lic` },
      { firstName: 'Luminița', lastName: 'Enache',       email: `luminita.enache.ph@${sid}.lic` },
      { firstName: 'Octavian', lastName: 'Petrescu',     email: `octavian.petrescu.ph@${sid}.lic` },
      { firstName: 'Carmen',   lastName: 'Ionescu',      email: `carmen.ionescu.ph@${sid}.lic` },
      { firstName: 'Vasile',   lastName: 'Moldovan',     email: `vasile.moldovan.ph@${sid}.lic` },
    ];

    const teacherIds: string[] = [];
    for (const t of placeholderTeachersData) {
      let teacher = await this.prisma.user.findUnique({ where: { email: t.email } });
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

    // 4. Elevi Placeholder — 10 per clasă, 40 total, nume românești diverse
    const placeholderStudentsData: { firstName: string; lastName: string; email: string; classKey: string }[] = [
      // 10-E (10 elevi)
      { firstName: 'Andrei',     lastName: 'Popa',        email: `andrei.popa.s@${sid}.lic`,       classKey: '10-E' },
      { firstName: 'Raluca',     lastName: 'Stoicescu',   email: `raluca.stoicescu.s@${sid}.lic`,  classKey: '10-E' },
      { firstName: 'Bogdan',     lastName: 'Radu',        email: `bogdan.radu.s@${sid}.lic`,       classKey: '10-E' },
      { firstName: 'Teodora',    lastName: 'Manea',       email: `teodora.manea.s@${sid}.lic`,     classKey: '10-E' },
      { firstName: 'Cristian',   lastName: 'Olteanu',     email: `cristian.olteanu.s@${sid}.lic`,  classKey: '10-E' },
      { firstName: 'Alina',      lastName: 'Dănilă',      email: `alina.danila.s@${sid}.lic`,      classKey: '10-E' },
      { firstName: 'Ștefan',     lastName: 'Voicu',       email: `stefan.voicu.s@${sid}.lic`,      classKey: '10-E' },
      { firstName: 'Larisa',     lastName: 'Chirilă',     email: `larisa.chirila.s@${sid}.lic`,    classKey: '10-E' },
      { firstName: 'Gabriel',    lastName: 'Tănase',      email: `gabriel.tanase.s@${sid}.lic`,    classKey: '10-E' },
      { firstName: 'Roxana',     lastName: 'Apostol',     email: `roxana.apostol.s@${sid}.lic`,    classKey: '10-E' },
      // 10-F (10 elevi)
      { firstName: 'Vlad',       lastName: 'Constantin',  email: `vlad.constantin.s@${sid}.lic`,   classKey: '10-F' },
      { firstName: 'Ioana',      lastName: 'Gheorghiu',   email: `ioana.gheorghiu.s@${sid}.lic`,   classKey: '10-F' },
      { firstName: 'Mihai',      lastName: 'Stănescu',    email: `mihai.stanescu.s@${sid}.lic`,    classKey: '10-F' },
      { firstName: 'Elena',      lastName: 'Rotaru',      email: `elena.rotaru.s@${sid}.lic`,      classKey: '10-F' },
      { firstName: 'Alexandru',  lastName: 'Enescu',      email: `alexandru.enescu.s@${sid}.lic`,  classKey: '10-F' },
      { firstName: 'Diana',      lastName: 'Moraru',      email: `diana.moraru.s@${sid}.lic`,      classKey: '10-F' },
      { firstName: 'Radu',       lastName: 'Bălan',       email: `radu.balan.s@${sid}.lic`,        classKey: '10-F' },
      { firstName: 'Georgiana',  lastName: 'Preda',       email: `georgiana.preda.s@${sid}.lic`,   classKey: '10-F' },
      { firstName: 'Ciprian',    lastName: 'Lupu',        email: `ciprian.lupu.s@${sid}.lic`,      classKey: '10-F' },
      { firstName: 'Andreea',    lastName: 'Nistor',      email: `andreea.nistor.s@${sid}.lic`,    classKey: '10-F' },
      // 11-C (10 elevi)
      { firstName: 'Marius',     lastName: 'Drăghici',    email: `marius.draghici.s@${sid}.lic`,   classKey: '11-C' },
      { firstName: 'Simona',     lastName: 'Florescu',    email: `simona.florescu.s@${sid}.lic`,   classKey: '11-C' },
      { firstName: 'Cosmin',     lastName: 'Andrei',      email: `cosmin.andrei.s@${sid}.lic`,     classKey: '11-C' },
      { firstName: 'Oana',       lastName: 'Dumitrescu',  email: `oana.dumitrescu.s@${sid}.lic`,   classKey: '11-C' },
      { firstName: 'Ionuț',      lastName: 'Vișan',       email: `ionut.visan.s@${sid}.lic`,       classKey: '11-C' },
      { firstName: 'Bianca',     lastName: 'Creangă',     email: `bianca.creanga.s@${sid}.lic`,    classKey: '11-C' },
      { firstName: 'Florin',     lastName: 'Matei',       email: `florin.matei.s@${sid}.lic`,      classKey: '11-C' },
      { firstName: 'Mihaela',    lastName: 'Rusu',        email: `mihaela.rusu.s@${sid}.lic`,      classKey: '11-C' },
      { firstName: 'Dragoș',     lastName: 'Iacob',       email: `dragos.iacob.s@${sid}.lic`,      classKey: '11-C' },
      { firstName: 'Cristina',   lastName: 'Pârvulescu',  email: `cristina.parvulescu.s@${sid}.lic`, classKey: '11-C' },
      // 12-A (10 elevi)
      { firstName: 'Sorin',      lastName: 'Avram',       email: `sorin.avram.s@${sid}.lic`,       classKey: '12-A' },
      { firstName: 'Laura',      lastName: 'Grigorescu',  email: `laura.grigorescu.s@${sid}.lic`,  classKey: '12-A' },
      { firstName: 'Adrian',     lastName: 'Petrescu',    email: `adrian.petrescu.s@${sid}.lic`,   classKey: '12-A' },
      { firstName: 'Ramona',     lastName: 'Brânzan',     email: `ramona.branzan.s@${sid}.lic`,    classKey: '12-A' },
      { firstName: 'Cătălin',    lastName: 'Moise',       email: `catalin.moise.s@${sid}.lic`,     classKey: '12-A' },
      { firstName: 'Alecia',     lastName: 'Bordea',      email: `alecia.bordea.s@${sid}.lic`,     classKey: '12-A' },
      { firstName: 'Robert',     lastName: 'Zaharia',     email: `robert.zaharia.s@${sid}.lic`,    classKey: '12-A' },
      { firstName: 'Nicoleta',   lastName: 'Ciupercă',    email: `nicoleta.ciuperca.s@${sid}.lic`, classKey: '12-A' },
      { firstName: 'Dănuț',      lastName: 'Olaru',       email: `danut.olaru.s@${sid}.lic`,       classKey: '12-A' },
      { firstName: 'Isabela',    lastName: 'Toma',        email: `isabela.toma.s@${sid}.lic`,      classKey: '12-A' },
    ];

    const studentMap = new Map<string, string>();
    for (const s of placeholderStudentsData) {
      let student = await this.prisma.user.findUnique({ where: { email: s.email } });
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
      'Matematică', 'Fizică', 'Chimie', 'Informatică',
      'Limba și literatura română', 'Limba engleză',
      'Istorie', 'Biologie', 'Geografie',
    ];

    const subjectMap = new Map<string, string>();
    for (const subName of placeholderSubjects) {
      let subj = await this.prisma.subject.findFirst({ where: { schoolId, name: subName } });
      if (!subj) {
        subj = await this.prisma.subject.create({ data: { schoolId, name: subName } });
      }
      subjectMap.set(subName, subj.id);
    }

    // 6. Grupe de studiu pentru FIECARE clasă
    const subjectList = Array.from(subjectMap.entries());
    for (const [classKey, classId] of classesMap.entries()) {
      for (let i = 0; i < subjectList.length; i++) {
        const [sName, sId] = subjectList[i];
        const assignedTeacherId = teacherIds[i % teacherIds.length];

        let group = await this.prisma.subjectGroup.findFirst({
          where: { schoolId, subjectId: sId, classId },
        });
        if (!group) {
          group = await this.prisma.subjectGroup.create({
            data: {
              schoolId,
              subjectId: sId,
              classId,
              teacherId: assignedTeacherId,
              name: `${sName} - ${classKey}`,
            },
          });
        }

        // Înrolare profesor
        await this.prisma.groupMembership.upsert({
          where: { groupId_userId: { groupId: group.id, userId: assignedTeacherId } },
          update: {},
          create: { groupId: group.id, userId: assignedTeacherId, membershipRole: MembershipRole.TEACHER, canPost: true },
        });

        // Înrolare elevi din clasă
        const classStudents = await this.prisma.classMembership.findMany({ where: { classId } });
        for (const cs of classStudents) {
          await this.prisma.groupMembership.upsert({
            where: { groupId_userId: { groupId: group.id, userId: cs.studentId } },
            update: {},
            create: { groupId: group.id, userId: cs.studentId, membershipRole: MembershipRole.STUDENT, canPost: false },
          });
        }
      }
    }

    // 7. Orar Placeholder (clasa 10-E și 10-F)
    const timetableSlots: { day: DayOfWeek; period: number; subject: string; teacherIdx: number; time: [string, string] }[] = [
      { day: DayOfWeek.MONDAY,    period: 1, subject: 'Matematică',               teacherIdx: 0, time: ['08:00', '08:50'] },
      { day: DayOfWeek.MONDAY,    period: 2, subject: 'Informatică',               teacherIdx: 1, time: ['09:00', '09:50'] },
      { day: DayOfWeek.MONDAY,    period: 3, subject: 'Limba și literatura română', teacherIdx: 2, time: ['10:00', '10:50'] },
      { day: DayOfWeek.MONDAY,    period: 4, subject: 'Fizică',                   teacherIdx: 3, time: ['11:00', '11:50'] },
      { day: DayOfWeek.TUESDAY,   period: 1, subject: 'Chimie',                   teacherIdx: 4, time: ['08:00', '08:50'] },
      { day: DayOfWeek.TUESDAY,   period: 2, subject: 'Biologie',                 teacherIdx: 5, time: ['09:00', '09:50'] },
      { day: DayOfWeek.TUESDAY,   period: 3, subject: 'Matematică',               teacherIdx: 0, time: ['10:00', '10:50'] },
      { day: DayOfWeek.WEDNESDAY, period: 1, subject: 'Limba engleză',            teacherIdx: 6, time: ['08:00', '08:50'] },
      { day: DayOfWeek.WEDNESDAY, period: 2, subject: 'Istorie',                  teacherIdx: 7, time: ['09:00', '09:50'] },
      { day: DayOfWeek.WEDNESDAY, period: 3, subject: 'Geografie',                teacherIdx: 8, time: ['10:00', '10:50'] },
      { day: DayOfWeek.THURSDAY,  period: 1, subject: 'Fizică',                   teacherIdx: 3, time: ['08:00', '08:50'] },
      { day: DayOfWeek.THURSDAY,  period: 2, subject: 'Informatică',               teacherIdx: 1, time: ['09:00', '09:50'] },
      { day: DayOfWeek.FRIDAY,    period: 1, subject: 'Limba și literatura română', teacherIdx: 2, time: ['08:00', '08:50'] },
      { day: DayOfWeek.FRIDAY,    period: 2, subject: 'Matematică',               teacherIdx: 0, time: ['09:00', '09:50'] },
    ];

    for (const targetClass of ['10-E', '10-F']) {
      const targetClassId = classesMap.get(targetClass);
      if (!targetClassId) continue;
      for (const slot of timetableSlots) {
        const subjId = subjectMap.get(slot.subject);
        const tId = teacherIds[slot.teacherIdx % teacherIds.length];
        if (!subjId || !tId) continue;
        const exists = await this.prisma.timetableEntry.findFirst({
          where: { classId: targetClassId, dayOfWeek: slot.day, period: slot.period },
        });
        if (!exists) {
          await this.prisma.timetableEntry.create({
            data: {
              schoolId,
              classId: targetClassId,
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

    return {
      success: true,
      message: `Generate: 4 clase (10-E, 10-F, 11-C, 12-A), 12 profesori, 40 elevi, 9 materii, orar complet.`,
    };
  }
}
