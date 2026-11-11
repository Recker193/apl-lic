import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import {
  CreateHomeroomAssignmentDto,
  SetConductGradeDto,
  UpdateHomeroomAssignmentDto,
} from './homeroom.dto';
import { HomeroomService } from './homeroom.service';

@Controller()
export class HomeroomController {
  constructor(private readonly service: HomeroomService) {}

  @Post('homeroom-assignments')
  createAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHomeroomAssignmentDto,
  ) {
    return this.service.createAssignment(user, dto);
  }

  @Patch('homeroom-assignments/:id')
  updateAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHomeroomAssignmentDto,
  ) {
    return this.service.updateAssignment(user, id, dto);
  }

  @Get('homeroom-assignments')
  listAssignments(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listAssignments(user);
  }

  @Get('classes/:id/summary')
  getClassSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('termId') termId?: string,
  ) {
    return this.service.getClassSummary(user, id, termId);
  }

  @Put('classes/:id/conduct/:studentId')
  setConductGrade(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() dto: SetConductGradeDto,
    @Query('termId') termId?: string,
  ) {
    return this.service.setConductGrade(user, id, studentId, dto, termId);
  }
}
