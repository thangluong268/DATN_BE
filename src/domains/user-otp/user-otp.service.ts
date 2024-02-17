import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserOTP } from './schema/user-otp.schema';

@Injectable()
export class UserOTPService {
  constructor(
    @InjectModel(UserOTP.name) private readonly userOTPModel: Model<UserOTP>,
  ) {}
}
