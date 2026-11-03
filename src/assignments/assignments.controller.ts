import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AssignmentProgressStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { AssignmentsService } from './assignments.service';

class CreateAssignmentDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  dueAt!: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}

class UpdateAssignmentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  dueAt?: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}

class ProgressDto {
  @IsEnum(AssignmentProgressStatus)
  status!: AssignmentProgressStatus;
}

@Controller()
export class AssignmentsController {
  constructor(private readonly service: AssignmentsService) {}

  @Get('groups/:id/assignments')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.list(user, id);
  }

  @Post('groups/:id/assignments')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.service.create(user, id, dto);
  }

  @Get('assignments/:id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.get(user, id);
  }

  @Patch('assignments/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete('assignments/:id')
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.archive(user, id);
  }

  @Get('assignments/:id/progress')
  progress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.getProgress(user, id);
  }

  @Patch('assignments/:id/progress/me')
  myProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProgressDto,
  ) {
    return this.service.updateMyProgress(user, id, dto.status);
  }
}
