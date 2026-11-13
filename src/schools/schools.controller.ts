import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PrismaService } from '../prisma/prisma.service';
import { SeedService } from './seed.service';

class UpdateSchoolDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

@Controller('schools')
@UseGuards(RolesGuard)
export class SchoolsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seedService: SeedService,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.prisma.school.findUniqueOrThrow({
      where: { id: user.schoolId },
      select: { id: true, name: true, address: true },
    });
  }

  // Alias compatibil pentru apelurile frontend /api/v1/admin/school
  @Get('../admin/school')
  async getSchoolCompat(@CurrentUser() user: AuthenticatedUser) {
    return this.me(user);
  }

  @Post('seed-placeholders')
  @Roles(UserRole.ADMIN)
  async seedPlaceholders(@CurrentUser() user: AuthenticatedUser) {
    return this.seedService.seedPlaceholdersForSchool(user);
  }

  @Patch('me')
  @Roles(UserRole.ADMIN)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSchoolDto,
  ) {
    return this.prisma.school.update({
      where: { id: user.schoolId },
      data: dto,
      select: { id: true, name: true, address: true },
    });
  }
}
