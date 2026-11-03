import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { loadEnv } from '../config/env';

export type OutboundMail = {
  to: string;
  subject: string;
  text: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly lastMessages: OutboundMail[] = [];

  async send(mail: OutboundMail): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      this.lastMessages.push(mail);
      return;
    }

    const env = loadEnv();
    try {
      const transporter = nodemailer.createTransport({
        host: env.mailHost,
        port: env.mailPort,
        secure: false,
      });
      await transporter.sendMail({
        from: env.mailFrom,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
      });
    } catch {
      this.logger.error('Failed to send email');
    }
  }

  getLastMessage(): OutboundMail | undefined {
    return this.lastMessages[this.lastMessages.length - 1];
  }

  extractTokenFromLastMessage(): string | undefined {
    const message = this.getLastMessage();
    if (!message) {
      return undefined;
    }
    const match = /token=([a-f0-9]+)/.exec(message.text);
    return match?.[1];
  }
}
