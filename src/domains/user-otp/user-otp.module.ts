import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserOTPSchema } from './schema/user-otp.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'UserOTP', schema: UserOTPSchema }]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class UserOTPModule {}
