import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Store, StoreSchema } from 'domains/store/schema/store.schema';
import { User, UserSchema } from 'domains/user/schema/user.schema';
import { PromotionController } from './promotion.controller';
import { PromotionService } from './promotion.service';
import { Promotion, PromotionSchema } from './schema/promotion.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Promotion.name, schema: PromotionSchema },
      { name: Store.name, schema: StoreSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PromotionController],
  providers: [PromotionService],
  exports: [MongooseModule],
})
export class PromotionModule {}
