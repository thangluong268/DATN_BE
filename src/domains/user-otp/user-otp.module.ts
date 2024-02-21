import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailModule } from 'src/services/mail/mail.module';
import { UserModule } from '../user/user.module';
import { UserOTP, UserOTPSchema } from './schema/user-otp.schema';
import { UserOTPService } from './user-otp.service';
import { UserOTPController } from './user-otp.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserOTP.name, schema: UserOTPSchema }]),
    MailModule,
    UserModule,
  ],
  controllers: [UserOTPController],
  providers: [UserOTPService],
  exports: [],
})
export class UserOTPModule {}
