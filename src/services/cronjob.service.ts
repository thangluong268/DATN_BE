import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Bill } from 'domains/bill/schema/bill.schema';
import { Product } from 'domains/product/schema/product.schema';
import { Model } from 'mongoose';
import { PAYMENT_METHOD } from 'shared/enums/bill.enum';

@Injectable()
export class CronjobsService {
  private readonly logger = new Logger(CronjobsService.name);
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,

    @InjectModel(Bill.name)
    private readonly billModel: Model<Bill>,
  ) {}

  @Cron('0 * * * * *')
  onStart() {
    this.logger.log('Entry CronJobs Service starting...');
  }

  @Cron('*/1 * * * * *')
  async disableProduct() {
    await this.productModel.updateMany({ quantity: { $lte: 0 }, status: true }, { $set: { status: false } });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanBill() {
    await this.billModel.deleteMany({ isPaid: false, paymentMethod: { $ne: PAYMENT_METHOD.CASH } });
  }
}
