import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ROLES } from 'src/shared/constants/role.constant';
import { User } from '../user/schemas/user.schema';
import { AuthService } from './auth.service';
import { Roles } from './decorators/auth-role.decorator';
import { AuthJwtATGuard } from './guards/auth-jwt-at.guard';
import { AuthJwtRTGuard } from './guards/auth-jwt-rt.guard';
import { ForgetPassREQ } from './request/forget-password.request';
import { AuthSignUpREQ } from './request/sign-up.request';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Req() req) {
    const user: User = req.user;
    return this.authService.login(user);
  }

  @Post('signup')
  async signup(@Body() body: AuthSignUpREQ) {
    return this.authService.signup(body);
  }

  @Post('forgetPassword')
  async forgetPassword(@Body() body: ForgetPassREQ) {
    return this.authService.forgetPassword(body);
  }

  @Roles(ROLES.ADMIN, ROLES.USER, ROLES.SELLER, ROLES.MANAGER, ROLES.SHIPPER)
  @UseGuards(AuthJwtATGuard)
  @Delete('logout')
  async logout(@Req() req) {
    const user = req.user;
    return this.authService.logout(user);
  }

  @UseGuards(AuthJwtRTGuard)
  @Get('refreshToken')
  async refreshToken(@Req() req) {
    const { userId, refreshToken } = req.user;
    return this.authService.refreshToken(userId, refreshToken);
  }
}
