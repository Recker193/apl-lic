import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.prisma.school.findUniqueOrThrow({
      where: { id: user.schoolId },
      select: { id: true, name: true, address: true },
    });
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
