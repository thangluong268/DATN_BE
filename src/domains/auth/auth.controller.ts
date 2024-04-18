import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BaseResponse } from 'shared/generics/base.response';
import { ROLE_NAME } from '../../shared/enums/role-name.enum';
import { User } from '../user/schema/user.schema';
import { AuthService } from './auth.service';
import { Roles } from './decorators/auth-role.decorator';
import { AuthJwtATGuard } from './guards/auth-jwt-at.guard';
import { AuthJwtRTGuard } from './guards/auth-jwt-rt.guard';
import { AuthRoleGuard } from './guards/auth-role.guard';
import { FacebookOAuthGuard } from './guards/facebook-oauth.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { AuthSetRoleUserREQ } from './request/auth-set-role-user.request';
import { ForgetPassREQ } from './request/forget-password.request';
import { AuthSignUpREQ } from './request/sign-up.request';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthJwtRTGuard)
  @Get('refreshToken')
  refreshToken(@Req() req) {
    const { userId, refreshToken } = req.user;
    return this.authService.refreshToken(userId, refreshToken);
  }

  @Get('test')
  async test(): Promise<any> {
    return BaseResponse.ok();
  }

  @Get('login/google')
  @UseGuards(GoogleOAuthGuard)
  async googleLogin(): Promise<any> {
    return HttpStatus.OK;
  }

  // Call back google
  @Get('login/oauth2/google')
  @UseGuards(GoogleOAuthGuard)
  googleLoginRedirect(@Req() req) {
    return this.authService.loginWithSocial(req);
  }

  @Get('login/facebook')
  @UseGuards(FacebookOAuthGuard)
  async facebookLogin(): Promise<any> {
    return HttpStatus.OK;
  }

  // Call back facebook
  @Get('login/facebook/redirect')
  @UseGuards(FacebookOAuthGuard)
  async facebookLoginRedirect(@Req() req) {
    return this.authService.loginWithSocial(req);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  login(@Req() req) {
    const user: User = req.user;
    return this.authService.login(user);
  }

  @Post('signup')
  signup(@Body() body: AuthSignUpREQ) {
    return this.authService.signup(body);
  }

  @Post('forgetPassword')
  forgetPassword(@Body() body: ForgetPassREQ) {
    return this.authService.forgetPassword(body);
  }

  @Roles(ROLE_NAME.ADMIN)
  @Patch(':userId/role')
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  changeRole(@Param('userId') userId: string, @Query() query: AuthSetRoleUserREQ) {
    return this.authService.changeRole(userId, query);
  }

  @Roles(ROLE_NAME.ADMIN, ROLE_NAME.USER, ROLE_NAME.SELLER, ROLE_NAME.MANAGER, ROLE_NAME.SHIPPER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Delete('logout')
  logout(@Req() req) {
    const user = req.user;
    return this.authService.logout(user);
  }
}
