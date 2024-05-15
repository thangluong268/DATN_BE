import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Bill } from 'domains/bill/schema/bill.schema';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { FeedbackShipperCreateREQ } from './request/feedback-shipper-create.request';
import { FeedbackShipperDetailRES } from './response/feedback-shipper-detail.response';
import { FeedbackShipper } from './schema/feedback-shipper.schema';

@Injectable()
export class FeedbackShipperService {
  private readonly logger = new Logger(FeedbackShipperService.name);
  constructor(
    @InjectModel(FeedbackShipper.name)
    private readonly feedbackShipperModel: Model<FeedbackShipper>,

    @InjectModel(Bill.name)
    private readonly billModel: Model<Bill>,
  ) {}

  async create(userId: string, body: FeedbackShipperCreateREQ) {
    this.logger.log(`Create Feedback Shipper`);
    const bill = await this.billModel.findOne({ _id: new ObjectId(body.billId), userId }).lean();
    if (bill.isFeedbackShipper) throw new BadRequestException('Bạn chỉ được đánh giá 1 lần');
    const shipperId = bill.shipperIds[0];
    await this.feedbackShipperModel.create({ shipperId, userId, ...body });
    await this.billModel.findByIdAndUpdate(body.billId, { isFeedbackShipper: true });
    return BaseResponse.withMessage({}, 'Đánh giá thành công');
  }

  async getDetail(billId: string) {
    this.logger.log(`Get Detail Feedback Shipper`);
    const feedBack = await this.feedbackShipperModel.aggregate([
      { $match: { billId } },
      { $addFields: { userObjId: { $toObjectId: '$userId' } } },
      { $addFields: { shipperObjId: { $toObjectId: '$shipperId' } } },
      {
        $lookup: {
          from: 'users',
          localField: 'userObjId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'shipperObjId',
          foreignField: '_id',
          as: 'shipper',
        },
      },
      { $unwind: '$user' },
      { $unwind: '$shipper' },
      { $project: { user: { password: 0 }, shipper: { password: 0 } } },
    ]);
    return BaseResponse.withMessage(FeedbackShipperDetailRES.of(feedBack[0]), 'Lấy thông tin đánh giá shipper thành công');
  }
}
