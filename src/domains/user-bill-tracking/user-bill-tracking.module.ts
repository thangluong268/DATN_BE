import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserBillTracking, UserBillTrackingSchema } from './schema/user-bill-tracking.schema';
import { UserBillTrackingService } from './user-bill-tracking.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: UserBillTracking.name, schema: UserBillTrackingSchema }])],
  providers: [UserBillTrackingService],
  exports: [UserBillTrackingService, MongooseModule],
})
export class UserBillTrackingModule {}
