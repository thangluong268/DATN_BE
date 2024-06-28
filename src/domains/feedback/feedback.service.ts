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
    if (numOfFeedback >= 3) throw new BadRequestException('Bạn chỉ được phản hồi 3 lần trên một sản phẩm');
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

    return BaseResponse.withMessage(toDocModel(newFeedback), 'Phản hồi thành công');
  }

  async getFeedbacks(user: any, query: FeedbackGetREQ) {
    this.logger.log(`Get Feedbacks`);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const [data, total] = await Promise.all([
      this.feedbackModel.aggregate([
        { $match: { productId: query.productId } },
        { $addFields: { userObjId: { $toObjectId: '$userId' } } },
        { $lookup: { from: 'users', localField: 'userObjId', foreignField: '_id', as: 'user' } },
        { $addFields: { avatar: { $first: '$user.avatar' }, name: { $first: '$user.fullName' } } },
        { $addFields: { isConsensus: user ? { $in: [user.userId, '$consensus'] } : false } },
        { $project: { user: 0, userObjId: 0, updatedAt: 0, isScan: 0, productId: 0 } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]),
      this.feedbackModel.countDocuments({ productId: query.productId }),
    ]);
    return PaginationResponse.ofWithTotalAndMessage(data, total, 'Lấy danh sách phản hồi thành công');
  }

  async countFeedbackByProduct(productId: string) {
    this.logger.log(`Count Feedback By Product: ${productId}`);
    const total = await this.feedbackModel.countDocuments({ productId });
    return BaseResponse.withMessage(total, 'Lấy tổng số phản hồi thành công');
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

  async updateConsensus(currentUserId: string, feedbackId: string) {
    this.logger.log(`Update Consensus: ${currentUserId}`);
    const feedback = await this.feedbackModel.findById(feedbackId).lean();
    if (!feedback) throw new NotFoundException('Không tìm thấy phản hồi');
    if (feedback.userId === currentUserId) throw new BadRequestException('Không thể đồng thuận với phản hồi của bản thân');
    const isConsensus = feedback.consensus.includes(currentUserId);
    const dataToUpdate = isConsensus ? { $pull: { consensus: currentUserId } } : { $push: { consensus: currentUserId } };
    await this.feedbackModel.findByIdAndUpdate(feedbackId, dataToUpdate);
    return BaseResponse.withMessage({}, 'Đồng thuận với phản hồi khác thành công');
  }
}
