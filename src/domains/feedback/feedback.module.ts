import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Store, StoreSchema } from 'domains/store/schema/store.schema';
import { User, UserSchema } from 'domains/user/schema/user.schema';
import { UserModule } from 'domains/user/user.module';
import { NotificationModule } from 'gateways/notifications/notification.module';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { Feedback, FeedbackSchema } from './schema/feedback.schema';
import { Product, ProductSchema } from 'domains/product/schema/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Feedback.name, schema: FeedbackSchema },
      { name: User.name, schema: UserSchema },
      { name: Store.name, schema: StoreSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    UserModule,
    NotificationModule,
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
