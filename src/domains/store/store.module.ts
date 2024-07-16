import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillModule } from 'domains/bill/bill.module';
import { Bill, BillSchema } from 'domains/bill/schema/bill.schema';
import { Feedback, FeedbackSchema } from 'domains/feedback/schema/feedback.schema';
import { Product, ProductSchema } from 'domains/product/schema/product.schema';
import { Report, ReportSchema } from 'domains/report/schema/report.schema';
import { StoreWallet, StoreWalletSchema } from 'domains/store-wallet/schema/store-wallet.schema';
import { User, UserSchema } from 'domains/user/schema/user.schema';
import { Store, StoreSchema } from './schema/store.schema';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Store.name, schema: StoreSchema },
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Feedback.name, schema: FeedbackSchema },
      { name: Bill.name, schema: BillSchema },
      { name: Report.name, schema: ReportSchema },
      { name: StoreWallet.name, schema: StoreWalletSchema },
    ]),
    forwardRef(() => BillModule),
  ],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService, MongooseModule],
})
export class StoreModule {}
