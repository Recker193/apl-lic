import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { CreateGradeDto, UpdateGradeDto, VoidGradeDto } from './grades.dto';
import { GradesService } from './grades.service';

@Controller()
export class GradesController {
  constructor(private readonly service: GradesService) {}

  @Get('groups/:id/grades')
  listGroupGrades(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('termId') termId?: string,
  ) {
    return this.service.listGroupGrades(user, id, termId);
  }

  @Get('students/:id/grades')
  listStudentGrades(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('termId') termId?: string,
  ) {
    return this.service.listStudentGrades(user, id, termId);
  }

  @Post('groups/:id/grades')
  createGrade(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateGradeDto,
  ) {
    return this.service.createGrade(user, id, dto);
  }

  @Patch('grades/:id')
  updateGrade(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGradeDto,
  ) {
    return this.service.updateGrade(user, id, dto);
  }

  @Delete('grades/:id')
  voidGrade(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidGradeDto,
  ) {
    return this.service.voidGrade(user, id, dto);
  }

  @Get('grades/:id/history')
  getGradeHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.getGradeHistory(user, id);
  }
}
