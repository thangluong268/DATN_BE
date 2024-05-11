import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Bill } from 'domains/bill/schema/bill.schema';
import { Store } from 'domains/store/schema/store.schema';
import { NotificationService } from 'gateways/notifications/notification.service';
import { Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { Product } from '../product/schema/product.schema';
import { EmojiDTO } from './dto/evaluation.dto';
import { EvaluationGetByUserRESP } from './response/evaluation-get-by-user.response';
import { Evaluation } from './schema/evaluation.schema';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);
  constructor(
    @InjectModel(Evaluation.name)
    private readonly evaluationModel: Model<Evaluation>,

    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,

    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,

    @InjectModel(Bill.name)
    private readonly billModel: Model<Bill>,

    private readonly notificationService: NotificationService,
  ) {}

  async create(productId: string) {
    this.logger.log(`Create Evaluation: ${productId}`);
    return await this.evaluationModel.create({ productId });
  }

  async expressedEmoji(userId: string, productId: string, name: string) {
    this.logger.log(`Expressed Emoji: ${userId} - ${productId} - ${name}`);
    const product = await this.productModel.findById(productId).lean();
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm này!');
    const store = await this.storeModel.findById(product.storeId).lean();
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    // const isEvaluation = await this.evaluationModel.findOne({
    //   productId,
    //   'hadEvaluation.userId': userId,
    //   'hadEvaluation.isHad': true,
    // });
    const evaluation = await this.evaluationModel.findOne({ productId });
    if (!evaluation) {
      throw new NotFoundException('Không tìm thấy đánh giá cho sản phẩm này!');
    }
    const index = evaluation.hadEvaluation.findIndex((had) => had.userId.toString() === userId.toString());
    if (index == -1) {
      evaluation.hadEvaluation.push({ userId, isHad: true });
    }
    await this.updateEmoji(userId, name, evaluation);
    return BaseResponse.withMessage(true, 'Đánh giá thành công!');
  }

  async updateEmoji(userId: string, name: string, evaluation: Evaluation) {
    const index = evaluation.emojis.findIndex((emoji) => emoji.userId.toString() === userId.toString());
    const newEmoji = { userId, name } as EmojiDTO;
    if (index == -1) {
      evaluation.emojis.push(newEmoji);
    } else {
      if (evaluation.emojis[index].name === name) {
        evaluation.emojis.splice(index, 1);
      } else {
        evaluation.emojis[index] = newEmoji;
      }
    }
    await evaluation.save();
  }

  async getByProductId(user: any, productId: string) {
    this.logger.log(`Get Evaluation By Product Id: ${productId}`);
    const evaluation = await this.evaluationModel.findOne({ productId });
    if (!evaluation) throw new NotFoundException('Không tìm thấy sản phẩm này!');
    const total = evaluation.emojis.length;
    const emoji = evaluation.emojis.reduce(
      (acc, e) => {
        acc[e.name]++;
        return acc;
      },
      { Haha: 0, Love: 0, Wow: 0, Sad: 0, Angry: 0, like: 0 },
    );
    let isReaction = false;
    let isPurchased = false;
    if (user) {
      const evaluationOfUser = evaluation.emojis.find((emoji) => emoji.userId.toString() === user.userId);
      evaluationOfUser ? (isReaction = true) : (isReaction = false);
      const bill = await this.billModel.findOne({ userId: user.userId, products: { $elemMatch: { id: productId.toString() } } });
      isPurchased = bill ? true : false;
    }
    return BaseResponse.withMessage(
      EvaluationGetByUserRESP.of(total, emoji, isReaction, isPurchased),
      'Lấy danh sách đánh giá thành công!',
    );
  }
}
