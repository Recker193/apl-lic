import { Body, Controller, Delete, Get, NotFoundException, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PrismaService } from '../prisma/prisma.service';

class CreateSubjectDto {
  @IsString()
  name!: string;
}

@Controller('subjects')
@UseGuards(RolesGuard)
export class SubjectsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.prisma.subject.findMany({
      where: { schoolId: user.schoolId },
      include: {
        groups: {
          select: {
            id: true,
            name: true,
            classId: true,
            teacherId: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSubjectDto,
  ) {
    return this.prisma.subject.create({
      data: { name: dto.name, schoolId: user.schoolId },
    });
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, schoolId: user.schoolId },
    });
    if (!subject) throw new NotFoundException('Materia nu a fost găsită');
    await this.prisma.subject.delete({ where: { id } });
    return { success: true };
  }
}
