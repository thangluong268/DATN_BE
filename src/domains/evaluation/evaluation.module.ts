import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from 'domains/product/schema/product.schema';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { Evaluation, EvaluationSchema } from './schema/evaluation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Evaluation.name, schema: EvaluationSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
