import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartModule } from 'domains/cart/cart.module';
import { ProductModule } from 'domains/product/product.module';
import { UserModule } from 'domains/user/user.module';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { Bill, BillSchema } from './schema/bill.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Bill.name, schema: BillSchema }]), UserModule, ProductModule, CartModule],
  controllers: [BillController],
  providers: [BillService],
})
export class BillModule {}
