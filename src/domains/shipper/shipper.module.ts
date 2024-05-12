import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bill, BillSchema } from 'domains/bill/schema/bill.schema';
import { Finance, FinanceSchema } from 'domains/finance/schema/finance.schema';
import { Tax, TaxSchema } from 'domains/tax/schema/tax.schema';
import { UserBillTracking, UserBillTrackingSchema } from 'domains/user-bill-tracking/schema/user-bill-tracking.schema';
import { User, UserSchema } from 'domains/user/schema/user.schema';
import { MailModule } from 'services/mail/mail.module';
import { ShipperController } from './shipper.controller';
import { ShipperService } from './shipper.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Bill.name, schema: BillSchema },
      { name: Tax.name, schema: TaxSchema },
      { name: Finance.name, schema: FinanceSchema },
      { name: UserBillTracking.name, schema: UserBillTrackingSchema },
    ]),
    MailModule,
  ],
  controllers: [ShipperController],
  providers: [ShipperService],
  exports: [ShipperService, MongooseModule],
})
export class ShipperModule {}
