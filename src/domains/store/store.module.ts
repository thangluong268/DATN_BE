import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackModule } from 'domains/feedback/feedback.module';
import { ProductModule } from 'domains/product/product.module';
import { User, UserSchema } from 'domains/user/schema/user.schema';
import { UserModule } from 'domains/user/user.module';
import { Store, StoreSchema } from './schema/store.schema';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { BillModule } from 'domains/bill/bill.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Store.name, schema: StoreSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => ProductModule),
    forwardRef(() => FeedbackModule),
    forwardRef(() => UserModule),
    forwardRef(() => BillModule),
  ],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
