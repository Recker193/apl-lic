import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { SendFeedbackDto } from './dto/send-feedback.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('feedback')
@UseGuards(RolesGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  sendFeedback(
    @Body() dto: SendFeedbackDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.feedbackService.sendFeedback(dto, user);
  }
}

