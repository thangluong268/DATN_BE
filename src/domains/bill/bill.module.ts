import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartModule } from 'domains/cart/cart.module';
import { NotificationModule } from 'domains/notification/notification.module';
import { ProductModule } from 'domains/product/product.module';
import { Product, ProductSchema } from 'domains/product/schema/product.schema';
import { Promotion, PromotionSchema } from 'domains/promotion/schema/promotion.schema';
import { StoreModule } from 'domains/store/store.module';
import { Tax, TaxSchema } from 'domains/tax/schema/tax.schema';
import { User, UserSchema } from 'domains/user/schema/user.schema';
import { UserModule } from 'domains/user/user.module';
import { PaymentModule } from 'payment/paymen.module';
import { RedisModule } from 'services/redis/redis.module';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { BillSeller, BillSellerSchema } from './schema/bill-seller.schema';
import { BillUser, BillUserSchema } from './schema/bill-user.schema';
import { Bill, BillSchema } from './schema/bill.schema';

@Module({
  imports: [
    RedisModule,
    MongooseModule.forFeature([
      { name: BillUser.name, schema: BillUserSchema },
      { name: BillSeller.name, schema: BillSellerSchema },
      { name: Bill.name, schema: BillSchema },
      { name: Promotion.name, schema: PromotionSchema },
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Tax.name, schema: TaxSchema },
    ]),
    CartModule,
    ProductModule,
    StoreModule,
    forwardRef(() => UserModule),
    forwardRef(() => NotificationModule),
    PaymentModule,
  ],
  controllers: [BillController],
  providers: [BillService],
  exports: [BillService],
})
export class BillModule {}
