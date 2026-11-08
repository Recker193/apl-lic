import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateClubDto,
  CreateWeekendMeetingDto,
  UpdateClubDto,
} from './clubs.dto';

@Injectable()
export class ClubsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthenticatedUser) {
    return this.prisma.club.findMany({
      where: { schoolId: user.schoolId },
      include: {
        coordinator: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        members: {
          select: {
            id: true,
            userId: true,
            joinedAt: true,
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        meetings: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async get(user: AuthenticatedUser, id: string) {
    const club = await this.prisma.club.findFirst({
      where: { id, schoolId: user.schoolId },
      include: {
        coordinator: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        members: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        meetings: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });
    if (!club) throw new NotFoundException('Clubul nu a fost găsit');
    return club;
  }

  async create(user: AuthenticatedUser, dto: CreateClubDto) {
    // Adminul poate crea sau oricine poate crea devenind coordonator
    const coordinatorId = (user.role === UserRole.ADMIN && dto.coordinatorId) 
      ? dto.coordinatorId 
      : user.id;

    // Asigură existența coordonatorului în aceeași școală
    const coordinator = await this.prisma.user.findFirst({
      where: { id: coordinatorId, schoolId: user.schoolId },
    });
    if (!coordinator) throw new NotFoundException('Coordonatorul specificat nu există');

    const club = await this.prisma.club.create({
      data: {
        schoolId: user.schoolId,
        name: dto.name,
        description: dto.description,
        formsUrl: dto.formsUrl,
        coordinatorId,
        members: {
          create: { userId: coordinatorId },
        },
      },
      include: {
        coordinator: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return club;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateClubDto) {
    const club = await this.get(user, id);
    if (club.coordinatorId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Doar coordonatorul sau un administrator poate edita clubul');
    }

    return this.prisma.club.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        formsUrl: dto.formsUrl,
        coordinatorId: (user.role === UserRole.ADMIN && dto.coordinatorId) ? dto.coordinatorId : undefined,
      },
    });
  }

  async delete(user: AuthenticatedUser, id: string) {
    const club = await this.get(user, id);
    if (club.coordinatorId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Doar coordonatorul sau un administrator poate șterge clubul');
    }
    await this.prisma.club.delete({ where: { id } });
    return { success: true };
  }

  // Înscriere în club (elev / membru)
  async join(user: AuthenticatedUser, clubId: string) {
    await this.get(user, clubId);
    return this.prisma.clubMember.upsert({
      where: { clubId_userId: { clubId, userId: user.id } },
      update: {},
      create: { clubId, userId: user.id },
    });
  }

  async leave(user: AuthenticatedUser, clubId: string) {
    await this.get(user, clubId);
    await this.prisma.clubMember.deleteMany({
      where: { clubId, userId: user.id },
    });
    return { success: true };
  }

  // Întâlniri de Weekend (Meetings)
  async addMeeting(user: AuthenticatedUser, clubId: string, dto: CreateWeekendMeetingDto) {
    const club = await this.get(user, clubId);
    if (club.coordinatorId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Doar coordonatorul clubului poate programa întâlniri de weekend');
    }

    if (dto.dayOfWeek !== 'SATURDAY' && dto.dayOfWeek !== 'SUNDAY') {
      throw new BadRequestException('Întâlnirile de weekend pot fi programate doar sâmbătă sau duminică');
    }

    return this.prisma.weekendMeeting.create({
      data: {
        clubId,
        title: dto.title,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        room: dto.room,
        description: dto.description,
      },
    });
  }

  async deleteMeeting(user: AuthenticatedUser, meetingId: string) {
    const meeting = await this.prisma.weekendMeeting.findUnique({
      where: { id: meetingId },
      include: { club: true },
    });
    if (!meeting) throw new NotFoundException('Întâlnirea nu a fost găsită');

    if (meeting.club.coordinatorId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Doar coordonatorul clubului poate anula întâlnirea');
    }

    await this.prisma.weekendMeeting.delete({ where: { id: meetingId } });
    return { success: true };
  }

  // Obține toate întâlnirile de weekend relevante pentru utilizatorul curent
  // Regulă cerută: Profesorii NU văd orarul de weekend al elevilor!
  async getMyWeekendSchedule(user: AuthenticatedUser) {
    if (user.role === UserRole.TEACHER) {
      // Profesorul vede DOAR dacă este coordonator al vreunui club sau membru explicit în club
      return this.prisma.weekendMeeting.findMany({
        where: {
          club: {
            schoolId: user.schoolId,
            OR: [
              { coordinatorId: user.id },
              { members: { some: { userId: user.id } } },
            ],
          },
        },
        include: {
          club: {
            select: { id: true, name: true, formsUrl: true, coordinatorId: true },
          },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    }

    if (user.role === UserRole.STUDENT) {
      // Elevul vede întâlnirile cluburilor din care face parte sau pe toate deschise din școală
      return this.prisma.weekendMeeting.findMany({
        where: {
          club: {
            schoolId: user.schoolId,
          },
        },
        include: {
          club: {
            select: { id: true, name: true, formsUrl: true, coordinatorId: true },
          },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    }

    // Admin vede toate întâlnirile de weekend din școală
    return this.prisma.weekendMeeting.findMany({
      where: {
        club: {
          schoolId: user.schoolId,
        },
      },
      include: {
        club: {
          select: { id: true, name: true, formsUrl: true, coordinatorId: true },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }
}

