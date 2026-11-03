import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { GroupsService } from './groups.service';

class CreateGroupDto {
  @IsUUID()
  subjectId!: string;

  @IsUUID()
  classId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;
}

class AddMemberDto {
  @IsUUID()
  userId!: string;
}

class PermissionsDto {
  @IsBoolean()
  canPost!: boolean;
}

class UpdateGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;
}

@Controller('groups')
@UseGuards(RolesGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.groupsService.list(user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.update(user, id, dto);
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.groupsService.get(user, id);
  }

  @Get(':id/members')
  members(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.groupsService.members(user, id);
  }

  @Post(':id/members')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  addMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.groupsService.addMember(user, id, dto.userId);
  }

  @Patch(':id/members/:userId/permissions')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  permissions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: PermissionsDto,
  ) {
    return this.groupsService.updateCanPost(user, id, userId, dto.canPost);
  }
}
