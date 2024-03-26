import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillModule } from 'domains/bill/bill.module';
import { FeedbackModule } from 'domains/feedback/feedback.module';
import { Feedback, FeedbackSchema } from 'domains/feedback/schema/feedback.schema';
import { ProductModule } from 'domains/product/product.module';
import { Product, ProductSchema } from 'domains/product/schema/product.schema';
import { User, UserSchema } from 'domains/user/schema/user.schema';
import { UserModule } from 'domains/user/user.module';
import { Store, StoreSchema } from './schema/store.schema';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { BillSeller, BillSellerSchema } from 'domains/bill/schema/bill-seller.schema';
import { BillUser, BillUserSchema } from 'domains/bill/schema/bill-user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Store.name, schema: StoreSchema },
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Feedback.name, schema: FeedbackSchema },
      { name: BillSeller.name, schema: BillSellerSchema },
      { name: BillUser.name, schema: BillUserSchema },
    ]),
    forwardRef(() => ProductModule),
    forwardRef(() => FeedbackModule),
    forwardRef(() => UserModule),
    forwardRef(() => BillModule),
  ],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService, MongooseModule],
})
export class StoreModule {}
