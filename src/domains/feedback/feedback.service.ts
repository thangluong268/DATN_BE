import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserService } from 'domains/user/user.service';
import { Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { FeedbackCreateREQ } from './request/feedback-create.request';
import { FeedbackGetREQ } from './request/feedback-get-request';
import { FeedbackUpdateConsensusREQ } from './request/feedback-update-consensus.request';
import { FeedbackGetRESP } from './response/feedback-get.response';
import { Feedback } from './schema/feedback.schema';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<Feedback>,

    private readonly userService: UserService,
  ) {}

  async create(userId: string, productId: string, feedback: FeedbackCreateREQ) {
    const newFeedback = await this.feedbackModel.create({ ...feedback, userId, productId });
    await this.userService.updateWallet(userId, 5000, 'plus');
    return BaseResponse.withMessage(toDocModel(newFeedback), 'Tạo feedback thành công');
  }

  async getFeedbacks(user: any, query: FeedbackGetREQ) {
    const condition = { productId: query.productId };
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.feedbackModel.countDocuments(condition);
    const feedbacks = await this.feedbackModel
      .find(condition, {}, { lean: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const data = await Promise.all(
      feedbacks.map(async (feedback) => {
        const userFeedback = await this.userService.findById(feedback.userId);
        return FeedbackGetRESP.of(user, userFeedback, feedback);
      }),
    );
    return PaginationResponse.ofWithTotalAndMessage(data, total, 'Lấy feedback thành công');
  }

  async countFeedbackByProduct(productId: string) {
    const total = await this.feedbackModel.countDocuments({ productId });
    return BaseResponse.withMessage(total, 'Lấy tổng feedback thành công');
  }

  async getFeedbackStar(productId: string) {
    const feedbacks = await this.feedbackModel.find({ productId }).sort({ createdAt: -1 });
    const star = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const starPercent = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (feedbacks.length === 0)
      return BaseResponse.withMessage({ starPercent, averageStar: 0 }, 'Lấy danh sách đánh giá sao thành công');
    feedbacks.forEach((feedback) => {
      star[feedback.star]++;
    });
    Object.keys(star).forEach((key) => {
      starPercent[key] = Math.round((star[key] / feedbacks.length) * 100);
    });
    let averageStar = 0;
    Object.keys(star).forEach((key) => {
      averageStar += star[key] * Number(key);
    });
    averageStar = Number((averageStar / feedbacks.length).toFixed(2));
    return BaseResponse.withMessage({ starPercent, averageStar }, 'Lấy danh sách đánh giá sao thành công');
  }

  async updateConsensus(currentUserId: string, query: FeedbackUpdateConsensusREQ) {
    const { productId, userId } = query;
    if (currentUserId.toString() === userId.toString()) throw new BadRequestException('Bạn không thể đồng thuận với chính mình!');
    const feedback = await this.feedbackModel.findOne({ userId, productId });
    if (!feedback) throw new NotFoundException('Không tìm thấy feedback');
    const index = feedback.consensus.findIndex((id) => id.toString() === currentUserId.toString());
    index == -1 ? feedback.consensus.push(currentUserId) : feedback.consensus.splice(index, 1);
    await feedback.save();
    return BaseResponse.withMessage({}, 'Đồng thuận feedback thành công');
  }
}
