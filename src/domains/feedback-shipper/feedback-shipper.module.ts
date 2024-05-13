import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackShipperService } from './feedback-shipper.service';
import { FeedbackShipper, FeedbackShipperSchema } from './schema/feedback-shipper.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: FeedbackShipper.name, schema: FeedbackShipperSchema }])],
  controllers: [],
  providers: [FeedbackShipperService],
  exports: [FeedbackShipperService],
})
export class FeedbackShipperModule {}
