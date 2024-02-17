import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './domains/auth/auth.module';
import { UserModule } from './domains/user/user.module';
import { UserOTPModule } from './domains/user-otp/user-otp.module';
import { UserTokenModule } from './domains/user-token/user-token.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    UserOTPModule,
    UserTokenModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
