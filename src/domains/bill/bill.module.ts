import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartModule } from 'domains/cart/cart.module';
import { ProductModule } from 'domains/product/product.module';
import { StoreModule } from 'domains/store/store.module';
import { UserModule } from 'domains/user/user.module';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { Bill, BillSchema } from './schema/bill.schema';
import { NotificationModule } from 'domains/notification/notification.module';
import { PaymentModule } from 'payment/paymen.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bill.name, schema: BillSchema }]),
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
