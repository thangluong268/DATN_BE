import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bill, BillSchema } from 'domains/bill/schema/bill.schema';
import { Product, ProductSchema } from 'domains/product/schema/product.schema';
import { Store, StoreSchema } from 'domains/store/schema/store.schema';
import { User, UserSchema } from 'domains/user/schema/user.schema';
import { NotificationModule } from 'gateways/notifications/notification.module';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { Evaluation, EvaluationSchema } from './schema/evaluation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Evaluation.name, schema: EvaluationSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Store.name, schema: StoreSchema },
      { name: Bill.name, schema: BillSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationModule,
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
