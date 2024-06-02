import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SOCIAL_APP } from 'shared/constants/user.constant';
import { ROLE_NAME } from '../../shared/enums/role-name.enum';
import { AuthService } from './auth.service';
import { Roles } from './decorators/auth-role.decorator';
import { AuthJwtATGuard } from './guards/auth-jwt-at.guard';
import { AuthJwtRTGuard } from './guards/auth-jwt-rt.guard';
import { AuthRoleGuard } from './guards/auth-role.guard';
import { FacebookOAuthGuard } from './guards/facebook-oauth.guard';
import { AuthSetRoleUserREQ } from './request/auth-set-role-user.request';
import { ForgetPassREQ } from './request/forget-password.request';
import { LoginSocialREQ } from './request/login-social.request';
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

  @Post('login/google')
  async googleLogin(@Body() body: LoginSocialREQ) {
    return this.authService.loginWithSocial(body.idToken, SOCIAL_APP.GOOGLE);
  }

  // // Call back google
  // @Get('login/oauth2/google')
  // @UseGuards(GoogleOAuthGuard)
  // async googleLoginRedirect(@Req() req, @Res() res: Response) {
  //   const data = await this.authService.loginWithSocial(req);
  //   res.redirect('http://localhost:3000/login?data=' + data);
  // }

  @Get('login/facebook')
  @UseGuards(FacebookOAuthGuard)
  async facebookLogin(): Promise<any> {}

  // Call back facebook
  @Get('login/facebook/redirect')
  @UseGuards(FacebookOAuthGuard)
  async facebookLoginRedirect(@Req() req) {
    console.log(req);
    // return this.authService.loginWithSocial(req);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  login(@Req() req) {
    const user = req.user;
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
