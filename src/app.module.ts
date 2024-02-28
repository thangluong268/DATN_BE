import { Module } from '@nestjs/common';
import { PolicyModule } from 'domains/policy/policy.module';
import { VNPayGateWay } from 'payment/vn-pay/vn-pay.controller';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './domains/auth/auth.module';
import { CategoryModule } from './domains/category/category.module';
import { ConversationModule } from './domains/conversations/conversation.module';
import { MessageModule } from './domains/message/message.module';
import { ProductModule } from './domains/product/product.module';
import { StoreModule } from './domains/store/store.module';
import { UserOTPModule } from './domains/user-otp/user-otp.module';
import { UserTokenModule } from './domains/user-token/user-token.module';
import { UserModule } from './domains/user/user.module';
import { SeederService } from './services/seeder.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    UserOTPModule,
    UserTokenModule,
    StoreModule,
    ProductModule,
    CategoryModule,
    ConversationModule,
    MessageModule,
    PolicyModule,
  ],
  controllers: [VNPayGateWay],
  providers: [SeederService],
})
export class AppModule {}
