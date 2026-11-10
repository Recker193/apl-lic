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
        secure: env.mailPort === 465,
        auth:
          process.env.MAIL_USER && process.env.MAIL_PASSWORD
            ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD }
            : undefined,
        // Fără aceste limite nodemailer poate aștepta până la 2 minute pe un
        // server SMTP care nu răspunde, blocând request-ul care trimite emailul
        // (creare invitație / activare cont) până la timeout-ul de proxy.
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
      });
      await transporter.sendMail({
        from: env.mailFrom,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email to ${mail.to}: ${reason}`);
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
