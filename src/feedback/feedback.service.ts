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

    const sent = await this.mailService.send({
      to: this.targetEmail,
      subject,
      text,
    });

    this.logger.log(`Feedback de la ${senderEmail} trimis către ${this.targetEmail}: ${sent}`);

    return {
      success: true,
      deliveredToMailServer: sent,
      message: 'Feedback-ul a fost trimis cu succes către echipa de suport Oktapod!',
    };
  }
}

