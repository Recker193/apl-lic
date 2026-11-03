import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { CalendarService } from './calendar.service';

class CalendarQueryDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;
}

@Controller('calendar')
export class CalendarController {
  constructor(private readonly service: CalendarService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser, @Query() query: CalendarQueryDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (from > to) {
      throw new BadRequestException('from must be before to');
    }
    return this.service.range(user, from, to, query.subjectId);
  }
}
