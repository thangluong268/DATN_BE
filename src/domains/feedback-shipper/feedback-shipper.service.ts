import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { FeedbackCreateREQ } from './request/feedback-create.request';
import { FeedbackShipper } from './schema/feedback-shipper.schema';

@Injectable()
export class FeedbackShipperService {
  private readonly logger = new Logger(FeedbackShipperService.name);
  constructor(
    @InjectModel(FeedbackShipper.name)
    private readonly feedbackShipperModel: Model<FeedbackShipper>,
  ) {}

  async create(userId: string, productId: string, feedback: FeedbackCreateREQ) {
    this.logger.log(`Create Feedback: ${userId} - ${productId}`);
    // TO DO: check limit = 3, plus wallet in first time feedback
    const numOfFeedback = await this.feedbackShipperModel.countDocuments({ userId, productId });
    if (numOfFeedback > 3) throw new BadRequestException('Bạn chỉ được feedback 3 lần trên một sản phẩm');
    const newFeedback = await this.feedbackShipperModel.create({ ...feedback, userId, productId });
    return BaseResponse.withMessage(toDocModel(newFeedback), 'Tạo feedback thành công');
  }
}
