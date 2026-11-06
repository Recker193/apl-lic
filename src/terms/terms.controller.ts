import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { CreateTermDto } from './terms.dto';
import { TermsService } from './terms.service';

@Controller()
export class TermsController {
  constructor(private readonly service: TermsService) {}

  @Get('terms')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.list(user);
  }

  @Post('terms')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTermDto,
  ) {
    return this.service.create(user, dto);
  }

  @Patch('terms/:id/close')
  close(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.close(user, id);
  }
}
