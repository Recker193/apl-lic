import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { SendFeedbackDto } from './dto/send-feedback.dto';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);
  private readonly targetEmail = 'oktapod.support@gmail.com';

  constructor(private readonly mailService: MailService) {}

  async sendFeedback(dto: SendFeedbackDto, user?: AuthenticatedUser) {
    const senderName =
      dto.senderName ||
      (user ? `${user.firstName} ${user.lastName} (${user.role})` : 'Utilizator anonim');
    const senderEmail = dto.senderEmail || user?.email || 'Nespecificat';
    const category = dto.category || 'General';
    const stars = '★'.repeat(dto.rating) + '☆'.repeat(5 - dto.rating);

    const subject = `[Feedback Oktapod] ${dto.rating}/5 de la ${senderName} (${category})`;
    const text = [
      `A fost primit un nou feedback din aplicația Oktapod:`,
      `----------------------------------------------------`,
      `De la: ${senderName}`,
      `Email utilizator: ${senderEmail}`,
      `Categorie: ${category}`,
      `Rating: ${dto.rating}/5 [${stars}]`,
      `Data: ${new Date().toLocaleString('ro-RO')}`,
      `----------------------------------------------------`,
      `Mesaj / Sugestie:`,
      dto.message,
      `----------------------------------------------------`,
    ].join('\n');

    // 1. Trimite emailul de notificare feedback către echipa de suport oktapod.support@gmail.com
    const sentToSupport = await this.mailService.send({
      to: this.targetEmail,
      subject,
      text,
    });

    this.logger.log(`Feedback de la ${senderEmail} trimis către ${this.targetEmail}: ${sentToSupport}`);

    // 2. Trimite un email automat de confirmare / suport de la no.reply.oktapod@gmail.com către utilizator (dacă are email valid)
    let confirmationSent = false;
    if (senderEmail && senderEmail !== 'Nespecificat' && senderEmail.includes('@')) {
      const confirmationSubject = `[Suport Oktapod] Am primit feedback-ul tău (#${category})`;
      const confirmationText = [
        `Bună, ${senderName}!`,
        ``,
        `Îți mulțumim că ai trimis un feedback pentru platforma Oktapod.`,
        `Mesajul tău a fost înregistrat cu succes și transmis către echipa de asistență tehnică (oktapod.support@gmail.com).`,
        ``,
        `Detalii feedback înregistrat:`,
        `----------------------------------------------------`,
        `Rating acordat: ${dto.rating}/5 [${stars}]`,
        `Categorie: ${category}`,
        `Mesajul tău:`,
        dto.message,
        `----------------------------------------------------`,
        ``,
        `Dacă ai nevoie de asistență suplimentară, ne poți contacta direct la adresa de support: oktapod.support@gmail.com.`,
        ``,
        `Cu stimă,`,
        `Echipa de Suport Oktapod`,
        `no.reply.oktapod@gmail.com`,
      ].join('\n');

      confirmationSent = await this.mailService.send({
        to: senderEmail,
        subject: confirmationSubject,
        text: confirmationText,
      });

      this.logger.log(`Email de confirmare feedback trimis către utilizatorul ${senderEmail}: ${confirmationSent}`);
    }

    return {
      success: true,
      deliveredToMailServer: sentToSupport,
      confirmationSent,
      message: 'Feedback-ul a fost trimis cu succes către echipa de suport Oktapod!',
    };
  }
}

