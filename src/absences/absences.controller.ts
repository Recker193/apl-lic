import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { CreateAbsenceDto, ExcuseAbsenceDto } from './absences.dto';
import { AbsencesService } from './absences.service';

@Controller()
export class AbsencesController {
  constructor(private readonly service: AbsencesService) {}

  @Get('classes/:id/absences')
  listClassAbsences(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.listClassAbsences(user, id, from, to);
  }

  @Get('students/:id/absences')
  listStudentAbsences(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.listStudentAbsences(user, id, from, to);
  }

  @Post('absences')
  createAbsence(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAbsenceDto,
  ) {
    return this.service.createAbsence(user, dto);
  }

  @Patch('absences/:id/excuse')
  excuseAbsence(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExcuseAbsenceDto,
  ) {
    return this.service.excuseAbsence(user, id, dto);
  }

  @Get('students/:id/absences/totals')
  getAbsenceTotals(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('termId') termId: string,
  ) {
    return this.service.getAbsenceTotals(user, id, termId);
  }
}
