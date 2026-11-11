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

  /**
   * Trimite un email și raportează dacă a plecat către serverul SMTP.
   * Nu aruncă excepții: apelanții (creare invitație / înregistrare) trebuie să
   * poată continua și să afișeze utilizatorului că emailul nu a fost trimis.
   */
  async send(mail: OutboundMail): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') {
      this.lastMessages.push(mail);
      return true;
    }

    const env = loadEnv();
    try {
      const transporter = nodemailer.createTransport({
        host: env.mailHost,
        port: env.mailPort,
        secure: env.mailPort === 465,
        auth:
          env.mailUser && env.mailPassword
            ? { user: env.mailUser, pass: env.mailPassword }
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
      return true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send email to ${mail.to} via ${env.mailHost}:${env.mailPort}: ${reason}`,
      );
      if (!env.mailUser || !env.mailPassword) {
        this.logger.error(
          'SMTP authentication is not configured: set MAIL_USER and MAIL_PASSWORD (or MAIL_PASS).',
        );
      } else if (env.mailHost.includes('gmail')) {
        this.logger.error(
          `Check that MAIL_FROM (${env.mailFrom}) belongs to MAIL_USER (${env.mailUser}) and that MAIL_PASSWORD is a Gmail app password.`,
        );
      }
      return false;
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
