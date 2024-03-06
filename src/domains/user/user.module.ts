import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillModule } from 'domains/bill/bill.module';
import { NotificationModule } from 'domains/notification/notification.module';
import { StoreModule } from 'domains/store/store.module';
import { User, UserSchema } from './schema/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => BillModule),
    forwardRef(() => StoreModule),
    forwardRef(() => NotificationModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, MongooseModule],
})
export class UserModule {}
