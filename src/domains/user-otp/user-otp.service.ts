import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MailService } from 'services/mail/mail.service';
import { BaseResponse } from 'shared/generics/base.response';
import { UserService } from '../user/user.service';
import { CheckOTPREQ } from './request/check-otp.request';
import { SendOTPREQ } from './request/send-otp.request';
import { UserOTP } from './schema/user-otp.schema';

@Injectable()
export class UserOTPService {
  private readonly logger = new Logger(UserOTPService.name);
  constructor(
    @InjectModel(UserOTP.name)
    private readonly userOTPModel: Model<UserOTP>,
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {}

  async sendOTP(body: SendOTPREQ) {
    this.logger.log(`Send OTP: ${body.email}`);
    const email = body.email;
    const user = await this.userService.findOneByEmail(email);
    if (user) {
      throw new ConflictException('Email đã tồn tại!');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.mailService.sendOTP(email, otp);
    await this.upsert(email, otp);
    return BaseResponse.withMessage({}, 'Gửi mã OTP thành công');
  }

  async checkOTP(body: CheckOTPREQ) {
    this.logger.log(`Check OTP: ${body.email}`);
    const { email, otp } = body;
    const userOTP = await this.userOTPModel.findOne({ email, otp }, {}, { lean: true });
    if (!userOTP) {
      throw new BadRequestException('Mã OTP không chính xác');
    }
    return BaseResponse.withMessage({}, 'Xác thực thành công!');
  }

  async sendOTPForget(body: SendOTPREQ) {
    this.logger.log(`Send OTP Forget: ${body.email}`);
    const email = body.email;
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException('Email không tồn tại!');
    }
    console.log(user);
    if (user.socialApp) throw new BadRequestException(`Tài khoản thuộc quyền quản lý của ${user.socialApp}!`);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.mailService.sendOTP(email, otp);
    await this.upsert(email, otp);
    return BaseResponse.withMessage({}, 'Gửi mã OTP thành công');
  }

  async upsert(email: string, otp: string) {
    const userOTP = await this.userOTPModel.findOne({ email }, {}, { lean: true });
    if (userOTP) {
      return await this.userOTPModel.updateOne({ email }, { otp });
    } else {
      return await this.userOTPModel.create({ email, otp });
    }
  }
}
