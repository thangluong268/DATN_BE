import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'domains/user/schema/user.schema';
import { CheckLoginMiddleware } from 'middlewares/check-login.middleware';
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
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({}),
    UserModule,
    UserTokenModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtATStrategy, JwtRTStrategy, LocalStrategy, JwtHelper, GoogleStrategy, FacebookStrategy],
  exports: [JwtHelper, AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CheckLoginMiddleware).exclude({ path: 'auth/refreshToken', method: RequestMethod.GET }).forRoutes(
      // { path: 'store-reputation', method: RequestMethod.GET },
      // { path: 'evaluation', method: RequestMethod.GET },
      // { path: 'promotions/:storeId', method: RequestMethod.GET },
      { path: '*', method: RequestMethod.ALL },
    );
  }
}
