import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillModule } from 'domains/bill/bill.module';
import { CartModule } from 'domains/cart/cart.module';
import { CategoryModule } from 'domains/category/category.module';
import { StoreModule } from 'domains/store/store.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product, ProductSchema } from './schema/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    StoreModule,
    CategoryModule,
    forwardRef(() => BillModule),
    forwardRef(() => CartModule),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
