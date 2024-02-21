import { Body, Controller, Post } from '@nestjs/common';
import { UserOTPService } from './user-otp.service';
import { CheckOTPREQ } from './request/check-otp.request';
import { SendOTPREQ } from './request/send-otp.request';

@Controller('userotp')
export class UserOTPController {
  constructor(private readonly userOTPService: UserOTPService) {}

  @Post('user/sendotp')
  sendOTP(@Body() body: SendOTPREQ) {
    return this.userOTPService.sendOTP(body);
  }

  @Post('user/checkotp')
  checkOTP(@Body() body: CheckOTPREQ) {
    return this.userOTPService.checkOTP(body);
  }

  @Post('user/sendotp-forget')
  sendOTPForget(@Body() body: SendOTPREQ) {
    return this.userOTPService.sendOTPForget(body);
  }
}
