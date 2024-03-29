import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillModule } from 'domains/bill/bill.module';
import { BillSeller, BillSellerSchema } from 'domains/bill/schema/bill-seller.schema';
import { BillUser, BillUserSchema } from 'domains/bill/schema/bill-user.schema';
import { NotificationModule } from 'domains/notification/notification.module';
import { Store, StoreSchema } from 'domains/store/schema/store.schema';
import { StoreModule } from 'domains/store/store.module';
import { User, UserSchema } from './schema/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Store.name, schema: StoreSchema },
      { name: BillSeller.name, schema: BillSellerSchema },
      { name: BillUser.name, schema: BillUserSchema },
    ]),
    forwardRef(() => BillModule),
    forwardRef(() => StoreModule),
    forwardRef(() => NotificationModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, MongooseModule],
})
export class UserModule {}
