import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { CreateTimetableEntryDto } from './timetable.dto';
import { TimetableService } from './timetable.service';

@Controller('timetable')
@UseGuards(RolesGuard)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get('me')
  getMyTimetable(@CurrentUser() user: AuthenticatedUser) {
    return this.timetableService.getMyTimetable(user);
  }

  @Get('class/:classId')
  getClassTimetable(
    @CurrentUser() user: AuthenticatedUser,
    @Param('classId', ParseUUIDPipe) classId: string,
  ) {
    return this.timetableService.getClassTimetable(user, classId);
  }

  @Post()
  createEntry(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTimetableEntryDto,
  ) {
    return this.timetableService.createEntry(user, dto);
  }

  @Delete(':id')
  deleteEntry(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.timetableService.deleteEntry(user, id);
  }
}

