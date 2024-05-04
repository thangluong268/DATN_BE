import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserRefundTracking, UserRefundTrackingSchema } from './schema/user-otp.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: UserRefundTracking.name, schema: UserRefundTrackingSchema }])],
  exports: [MongooseModule],
})
export class UserRefundTrackingModule {}
