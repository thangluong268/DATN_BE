import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { MAIL_FROM, MAIL_HOST, MAIL_PASSWORD, MAIL_USER } from 'app.config';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: MAIL_HOST,
        secure: false,
        auth: {
          user: MAIL_USER,
          pass: MAIL_PASSWORD,
        },
      },
      defaults: {
        from: MAIL_FROM,
      },
      template: {
        dir: process.cwd() + '/dist/services/mail/templates',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
