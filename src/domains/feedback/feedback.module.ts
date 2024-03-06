import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationModule } from 'domains/notification/notification.module';
import { ProductModule } from 'domains/product/product.module';
import { StoreModule } from 'domains/store/store.module';
import { UserModule } from 'domains/user/user.module';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { Feedback, FeedbackSchema } from './schema/feedback.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Feedback.name, schema: FeedbackSchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => StoreModule),
    forwardRef(() => ProductModule),
    forwardRef(() => NotificationModule),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
