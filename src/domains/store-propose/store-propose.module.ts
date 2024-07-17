import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from 'domains/product/schema/product.schema';
import { Store, StoreSchema } from 'domains/store/schema/store.schema';
import { StorePropose, StoreProposeSchema } from './schema/store-propose.schema';
import { StoreProposeController } from './store-propose.controller';
import { StoreProposeService } from './store-propose.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StorePropose.name, schema: StoreProposeSchema },
      { name: Store.name, schema: StoreSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [StoreProposeController],
  providers: [StoreProposeService],
  exports: [StoreProposeService, MongooseModule],
})
export class StoreProposeModule {}
