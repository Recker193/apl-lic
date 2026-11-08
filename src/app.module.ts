import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule } from '@nestjs/throttler';
import { AccessModule } from './common/access/access.module';
import { AuthGuard } from './common/guards/auth.guard';
import { CsrfGuard } from './common/guards/csrf.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { buildLoggerParams } from './common/logging/logger.config';
import { UserThrottlerGuard } from './common/http/user-throttler.guard';
import { AbsencesModule } from './absences/absences.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CalendarModule } from './calendar/calendar.module';
import { ClassesModule } from './classes/classes.module';
import { EventsModule } from './events/events.module';
import { ExamsModule } from './exams/exams.module';
import { GradesCalculationModule } from './grades-calculation/grades-calculation.module';
import { GradesModule } from './grades/grades.module';
import { GroupsModule } from './groups/groups.module';
import { HealthModule } from './health/health.module';
import { HomeroomModule } from './homeroom/homeroom.module';
import { InvitationsModule } from './invitations/invitations.module';
import { MailModule } from './mail/mail.module';
import { MaterialsModule } from './materials/materials.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { SchoolsModule } from './schools/schools.module';
import { StorageModule } from './storage/storage.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TermsModule } from './terms/terms.module';
import { TimetableModule } from './timetable/timetable.module';
import { ClubsModule } from './clubs/clubs.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    LoggerModule.forRoot(buildLoggerParams()),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 1000 }],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AccessModule,
    MailModule,
    StorageModule,
    AuditModule,
    AuthModule,
    HealthModule,
    UsersModule,
    InvitationsModule,
    SchoolsModule,
    ClassesModule,
    SubjectsModule,
    GroupsModule,
    AnnouncementsModule,
    AssignmentsModule,
    ExamsModule,
    MaterialsModule,
    NotificationsModule,
    EventsModule,
    CalendarModule,
    GradesModule,
    GradesCalculationModule,
    AbsencesModule,
    TermsModule,
    HomeroomModule,
    TimetableModule,
    ClubsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: UserThrottlerGuard },
  ],
})
export class AppModule {}
