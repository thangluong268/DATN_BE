import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillModule } from 'domains/bill/bill.module';
import { NotificationModule } from 'domains/notification/notification.module';
import { Product, ProductSchema } from 'domains/product/schema/product.schema';
import { Store, StoreSchema } from 'domains/store/schema/store.schema';
import { UserModule } from 'domains/user/user.module';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { Evaluation, EvaluationSchema } from './schema/evaluation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Evaluation.name, schema: EvaluationSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Store.name, schema: StoreSchema },
    ]),
    NotificationModule,
    forwardRef(() => UserModule),
    forwardRef(() => BillModule),
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
