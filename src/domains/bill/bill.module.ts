import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from 'domains/cart/schema/cart.schema';
import { Finance, FinanceSchema } from 'domains/finance/schema/finance.schema';
import { Product, ProductSchema } from 'domains/product/schema/product.schema';
import { Promotion, PromotionSchema } from 'domains/promotion/schema/promotion.schema';
import { Store, StoreSchema } from 'domains/store/schema/store.schema';
import { Tax, TaxSchema } from 'domains/tax/schema/tax.schema';
import { UserBillTrackingModule } from 'domains/user-bill-tracking/user-bill-tracking.module';
import { User, UserSchema } from 'domains/user/schema/user.schema';
import { ConversationModule } from 'gateways/conversations/conversation.module';
import { NotificationModule } from 'gateways/notifications/notification.module';
import { PaymentModule } from 'payment/paymen.module';
import { RedisModule } from 'services/redis/redis.module';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { Bill, BillSchema } from './schema/bill.schema';

@Module({
  imports: [
    RedisModule,
    MongooseModule.forFeature([
      { name: Bill.name, schema: BillSchema },
      { name: Promotion.name, schema: PromotionSchema },
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Tax.name, schema: TaxSchema },
      { name: Store.name, schema: StoreSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Finance.name, schema: FinanceSchema },
    ]),
    NotificationModule,
    PaymentModule,
    UserBillTrackingModule,
    ConversationModule,
  ],
  controllers: [BillController],
  providers: [BillService],
  exports: [BillService, MongooseModule],
})
export class BillModule {}
