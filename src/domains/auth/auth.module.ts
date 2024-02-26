import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtHelper } from 'shared/helpers/jwt.helper';
import { UserTokenModule } from '../user-token/user-token.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtATStrategy } from './strategies/auth-jwt-at.strategy';
import { JwtRTStrategy } from './strategies/auth-jwt-rt.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [JwtModule.register({}), UserModule, UserTokenModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtATStrategy,
    JwtRTStrategy,
    LocalStrategy,
    JwtHelper,
    GoogleStrategy,
    FacebookStrategy,
  ],
  exports: [JwtHelper],
})
export class AuthModule {}
