import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bill, BillSchema } from 'domains/bill/schema/bill.schema';
import { Store, StoreSchema } from 'domains/store/schema/store.schema';
import { NotificationModule } from 'gateways/notifications/notification.module';
import { User, UserSchema } from './schema/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Store.name, schema: StoreSchema },
      { name: Bill.name, schema: BillSchema },
    ]),
    forwardRef(() => NotificationModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, MongooseModule],
})
export class UserModule {}
