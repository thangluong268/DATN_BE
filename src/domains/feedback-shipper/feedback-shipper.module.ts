import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bill, BillSchema } from 'domains/bill/schema/bill.schema';
import { FeedbackShipperService } from './feedback-shipper.service';
import { FeedbackShipper, FeedbackShipperSchema } from './schema/feedback-shipper.schema';
import { FeedbackShipperController } from './feedback-shipper.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeedbackShipper.name, schema: FeedbackShipperSchema },
      { name: Bill.name, schema: BillSchema },
    ]),
  ],
  controllers: [FeedbackShipperController],
  providers: [FeedbackShipperService],
  exports: [FeedbackShipperService],
})
export class FeedbackShipperModule {}
