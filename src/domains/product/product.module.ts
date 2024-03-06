import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillModule } from 'domains/bill/bill.module';
import { CategoryModule } from 'domains/category/category.module';
import { EvaluationModule } from 'domains/evaluation/evaluation.module';
import { Evaluation, EvaluationSchema } from 'domains/evaluation/schema/evaluation.schema';
import { FeedbackModule } from 'domains/feedback/feedback.module';
import { NotificationModule } from 'domains/notification/notification.module';
import { StoreModule } from 'domains/store/store.module';
import { UserModule } from 'domains/user/user.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product, ProductSchema } from './schema/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Evaluation.name, schema: EvaluationSchema },
    ]),
    forwardRef(() => NotificationModule),
    CategoryModule,
    forwardRef(() => BillModule),
    forwardRef(() => UserModule),
    forwardRef(() => StoreModule),
    forwardRef(() => EvaluationModule),
    FeedbackModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
