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
import { IsOptional, IsString } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { ExamsService } from './exams.service';

class CreateExamDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  topic?: string;
}

class UpdateExamDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  topic?: string;
}

@Controller()
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  @Get('groups/:id/exams')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.list(user, id);
  }

  @Post('groups/:id/exams')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateExamDto,
  ) {
    return this.service.create(user, id, dto);
  }

  @Get('exams/:id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.get(user, id);
  }

  @Patch('exams/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExamDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete('exams/:id')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.cancel(user, id);
  }
}
