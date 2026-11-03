import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsProcessor {
  constructor(private readonly notifications: NotificationsService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleDueReminders(): Promise<void> {
    if (process.env.ENABLE_CRON !== 'true') {
      return;
    }
    await this.notifications.sendDueReminders();
  }
}
