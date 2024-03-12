import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BillModule } from 'domains/bill/bill.module';
import { CartModule } from 'domains/cart/cart.module';
import { EvaluationModule } from 'domains/evaluation/evaluation.module';
import { FeedbackModule } from 'domains/feedback/feedback.module';
import { NotificationModule } from 'domains/notification/notification.module';
import { PolicyModule } from 'domains/policy/policy.module';
import { ReportModule } from 'domains/report/report.module';
import { PaymentModule } from 'payment/paymen.module';
import { CronjobsService } from 'services/cronjob.service';
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
    ScheduleModule.forRoot(),
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
  ],
  providers: [SeederService, CronjobsService],
})
export class AppModule {}
