import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillModule } from 'domains/bill/bill.module';
import { Bill, BillSchema } from 'domains/bill/schema/bill.schema';
import { CategoryModule } from 'domains/category/category.module';
import { Evaluation, EvaluationSchema } from 'domains/evaluation/schema/evaluation.schema';
import { FeedbackModule } from 'domains/feedback/feedback.module';
import { Feedback, FeedbackSchema } from 'domains/feedback/schema/feedback.schema';
import { Store, StoreSchema } from 'domains/store/schema/store.schema';
import { NotificationModule } from 'gateways/notifications/notification.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product, ProductSchema } from './schema/product.schema';
import { ProductScraping } from './scraping/product.scraping';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Evaluation.name, schema: EvaluationSchema },
      { name: Feedback.name, schema: FeedbackSchema },
      { name: Store.name, schema: StoreSchema },
      { name: Bill.name, schema: BillSchema },
    ]),
    CategoryModule,
    BillModule,
    FeedbackModule,
    NotificationModule,
    // ElasticSearchModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductScraping],
  exports: [ProductService, MongooseModule],
})
export class ProductModule {}
