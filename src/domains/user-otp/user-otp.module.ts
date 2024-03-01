import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailModule } from 'services/mail/mail.module';
import { UserModule } from '../user/user.module';
import { UserOTP, UserOTPSchema } from './schema/user-otp.schema';
import { UserOTPController } from './user-otp.controller';
import { UserOTPService } from './user-otp.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: UserOTP.name, schema: UserOTPSchema }]), MailModule, UserModule],
  controllers: [UserOTPController],
  providers: [UserOTPService],
  exports: [],
})
export class UserOTPModule {}
