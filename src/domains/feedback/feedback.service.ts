import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from 'domains/product/schema/product.schema';
import { Store } from 'domains/store/schema/store.schema';
import { User } from 'domains/user/schema/user.schema';
import { UserService } from 'domains/user/user.service';
import { NotificationSubjectInfoDTO } from 'gateways/notifications/dto/notification-subject-info.dto';
import { NotificationGateway } from 'gateways/notifications/notification.gateway';
import { NotificationService } from 'gateways/notifications/notification.service';
import { Model } from 'mongoose';
import { NOTIFICATION_LINK } from 'shared/constants/notification.constant';
import { NotificationType } from 'shared/enums/notification.enum';
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
  private readonly logger = new Logger(FeedbackService.name);
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<Feedback>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,

    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,

    private readonly userService: UserService,

    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async create(userId: string, productId: string, feedback: FeedbackCreateREQ) {
    this.logger.log(`Create Feedback: ${userId} - ${productId}`);
    // TO DO: check limit = 3, plus wallet in first time feedback
    const numOfFeedback = await this.feedbackModel.countDocuments({ userId, productId });
    if (numOfFeedback > 3) throw new BadRequestException('Bạn chỉ được feedback 3 lần trên một sản phẩm');
    if (numOfFeedback === 0) await this.userModel.findByIdAndUpdate(userId, { $inc: { wallet: 100 } });
    const newFeedback = await this.feedbackModel.create({ ...feedback, userId, productId });

    const user = await this.userModel.findById(userId).lean();
    const product = await this.productModel.findById(productId).lean();
    const store = await this.storeModel.findById(product.storeId).lean();
    // Send notification
    const subjectInfo = NotificationSubjectInfoDTO.ofUser(user);
    const receiverId = store.userId;
    const link = NOTIFICATION_LINK[NotificationType.FEEDBACK] + productId;
    const notification = await this.notificationService.create(receiverId, subjectInfo, NotificationType.FEEDBACK, link);
    this.notificationGateway.sendNotification(receiverId, notification);

    return BaseResponse.withMessage(toDocModel(newFeedback), 'Tạo feedback thành công');
  }

  async getFeedbacks(user: any, query: FeedbackGetREQ) {
    this.logger.log(`Get Feedbacks`);
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
    this.logger.log(`Count Feedback By Product: ${productId}`);
    const total = await this.feedbackModel.countDocuments({ productId });
    return BaseResponse.withMessage(total, 'Lấy tổng feedback thành công');
  }

  async getFeedbackStar(productId: string) {
    this.logger.log(`Get Feedback Star: ${productId}`);
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
    this.logger.log(`Update Consensus: ${currentUserId}`);
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
