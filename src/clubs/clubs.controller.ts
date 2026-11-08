import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import {
  CreateClubDto,
  CreateWeekendMeetingDto,
  UpdateClubDto,
} from './clubs.dto';
import { ClubsService } from './clubs.service';

@Controller('clubs')
@UseGuards(RolesGuard)
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.clubsService.list(user);
  }

  @Get('weekend-schedule')
  getMyWeekendSchedule(@CurrentUser() user: AuthenticatedUser) {
    return this.clubsService.getMyWeekendSchedule(user);
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clubsService.get(user, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateClubDto,
  ) {
    return this.clubsService.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClubDto,
  ) {
    return this.clubsService.update(user, id, dto);
  }

  @Delete(':id')
  delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clubsService.delete(user, id);
  }

  @Post(':id/join')
  join(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clubsService.join(user, id);
  }

  @Post(':id/leave')
  leave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clubsService.leave(user, id);
  }

  @Post(':id/meetings')
  addMeeting(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWeekendMeetingDto,
  ) {
    return this.clubsService.addMeeting(user, id, dto);
  }

  @Delete('meetings/:meetingId')
  deleteMeeting(
    @CurrentUser() user: AuthenticatedUser,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
  ) {
    return this.clubsService.deleteMeeting(user, meetingId);
  }
}

