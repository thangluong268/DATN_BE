import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BillModule } from 'domains/bill/bill.module';
import { CartModule } from 'domains/cart/cart.module';
import { EvaluationModule } from 'domains/evaluation/evaluation.module';
import { FeedbackModule } from 'domains/feedback/feedback.module';
import { NotificationModule } from 'domains/notification/notification.module';
import { PolicyModule } from 'domains/policy/policy.module';
import { PromotionModule } from 'domains/promotion/promotion.module';
import { ReportModule } from 'domains/report/report.module';
import { TaxModule } from 'domains/tax/tax.module';
import { PaymentModule } from 'payment/paymen.module';
import { CloudinaryModule } from 'services/cloudinary/cloudinary.module';
import { CronjobsService } from 'services/cronjob.service';
import { RedisModule } from 'services/redis/redis.module';
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
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    DatabaseModule,
    UserModule,
    AuthModule,
    UserOTPModule,
    UserTokenModule,
    StoreModule,
    ProductModule,
    CategoryModule,
    ConversationModule,
    MessageModule,
    PolicyModule,
    PaymentModule,
    CartModule,
    BillModule,
    NotificationModule,
    EvaluationModule,
    FeedbackModule,
    ReportModule,
    PromotionModule,
    CloudinaryModule,
    TaxModule,
  ],
  providers: [SeederService, CronjobsService],
})
export class AppModule {}
