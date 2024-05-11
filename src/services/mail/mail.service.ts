import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOTP(email: string, otp: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verification Code',
      template: 'send-otp.hbs',
      context: {
        otp,
      },
    });
  }

  async sendWarningStore(email: string, content: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'STORE WARNING',
      template: 'store-warning.hbs',
      context: {
        content,
      },
    });
  }

  async sendBanStore(email: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'STORE BANNED',
      template: 'store-banned.hbs',
      context: {
        content: 'Your store has been banned. Please contact the administrator for more information.',
      },
    });
  }

  async sendActiveShipper(receiverEmail: string, email: string, password: string) {
    await this.mailerService.sendMail({
      to: receiverEmail,
      subject: 'WELCOME TO DTEX',
      template: 'active-shipper.hbs',
      context: {
        email,
        password,
      },
    });
  }
}
