import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Store } from 'domains/store/schema/store.schema';
import { User } from 'domains/user/schema/user.schema';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { PromotionCreateREQ } from './request/promotion-create.request';
import { PromotionGetByStore } from './request/promotion-get-by-store.request';
import { PromotionUpdateREQ } from './request/promotion-update.request';
import { PromotionGetByStoreIdRESP } from './response/promotion-get-by-store-id.response';
import { PromotionGetDetailRESP } from './response/promotion-get-detail.response';
import { PromotionGetMyRESP } from './response/promotion-get-my.response';
import { Promotion } from './schema/promotion.schema';

@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);
  constructor(
    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<Promotion>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,
  ) {}

  async create(userId: string, body: PromotionCreateREQ) {
    this.logger.log(`userId: ${userId}, body: ${JSON.stringify(body)}`);
    const store = await this.storeModel.findOne({ userId }).lean();
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng!');
    const voucherCode = await this.generateVoucherCode();
    return this.promotionModel.create({ ...body, voucherCode, storeId: store._id.toString() });
  }

  async getPromotionsByStoreId(storeId: string) {
    this.logger.log(`storeId: ${storeId}`);
    const promotions = await this.promotionModel
      .find({ storeId, isActive: true }, { createdAt: 0, updatedAt: 0, userSaves: 0, userUses: 0 })
      .lean();
    const data = promotions.map((promotion) => PromotionGetByStoreIdRESP.of(promotion));
    return BaseResponse.withMessage(data, 'Lấy danh sách khuyến mãi của cửa hàng thành công!');
  }

  async getMyPromotions(userId: string, query: PromotionGetByStore) {
    this.logger.log(`Lấy danh sách khuyến mãi của cửa hàng bản thân: userId: ${userId}`);
    const store = await this.storeModel.findOne({ userId }).lean();
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng!');
    const condition = PromotionGetByStore.toQueryCondition(store._id, query);
    const promotions = await this.promotionModel
      .find(condition, { createdAt: 0, updatedAt: 0, userSaves: 0, userUses: 0 })
      .lean();
    const data = promotions.map((promotion) => PromotionGetMyRESP.of(promotion));
    return BaseResponse.withMessage(data, 'Lấy danh sách khuyến mãi của cửa hàng thành công!');
  }

  async getPromotion(userId: string, promotionId: string) {
    this.logger.log(`get detail promotionId: ${promotionId}`);
    const store = await this.storeModel.findOne({ userId }).lean();
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng!');
    const promotion = await this.promotionModel.findById(promotionId).lean();
    if (!promotion) throw new NotFoundException('Không tìm thấy khuyến mãi!');
    if (promotion.storeId.toString() !== store._id.toString()) throw new NotFoundException('Không tìm thấy khuyến mãi!');
    return BaseResponse.withMessage(PromotionGetDetailRESP.of(promotion), 'Lấy thông tin chi tiết khuyến mãi thành công!');
  }

  async getUserUsesPromotion(userId: string, promotionId: string) {
    this.logger.log(`get user uses promotionId: ${promotionId}`);
    const store = await this.storeModel.findOne({ userId }).lean();
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng!');
    const promotion = await this.promotionModel.findById(promotionId).lean();
    if (!promotion) throw new NotFoundException('Không tìm thấy khuyến mãi!');
    if (promotion.storeId.toString() !== store._id.toString()) throw new NotFoundException('Không tìm thấy khuyến mãi!');
    const promotionObjId = new ObjectId(promotionId);
    const data = await this.promotionModel.aggregate([
      { $match: { _id: promotionObjId } },
      { $unwind: '$userUses' },
      { $addFields: { userIdString: { $toObjectId: '$userUses' } } },
      {
        $lookup: {
          from: 'users',
          localField: 'userIdString',
          foreignField: '_id',
          as: 'userInfos',
        },
      },
      { $unwind: '$userInfos' },
      {
        $project: {
          _id: 0,
          id: '$userInfos._id',
          avatar: '$userInfos.avatar',
          fullName: '$userInfos.fullName',
          email: '$userInfos.email',
          phone: '$userInfos.phone',
          gender: '$userInfos.gender',
        },
      },
    ]);
    return BaseResponse.withMessage(data, 'Lấy danh sách người dùng sử dụng khuyến mãi thành công!');
  }

  async update(userId: string, promotionId: string, body: PromotionUpdateREQ) {
    this.logger.log(`update promotionId: ${promotionId}, body: ${JSON.stringify(body)}`);
    const store = await this.storeModel.findOne({ userId }).lean();
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng!');
    const promotion = await this.promotionModel.findById(promotionId).lean();
    if (!promotion) throw new NotFoundException('Không tìm thấy khuyến mãi!');
    if (promotion.storeId.toString() !== store._id.toString()) throw new NotFoundException('Không tìm thấy khuyến mãi!');
    await this.promotionModel.findByIdAndUpdate(promotionId, { ...body });
    return BaseResponse.withMessage({}, 'Cập nhật khuyến mãi thành công!');
  }

  private async generateVoucherCode() {
    const characters = `ABCDA1231KQJLALM121KLSDF097ESEUQWIHADLJALKSQIP${new Date().getTime()}O123ASDWEIQ12321OU8EFGHIJKLMVWXYZ0123456789`;
    const maxLengthCode = 8;
    let voucherCode = '';
    for (let i = 0; i < maxLengthCode; i++) {
      voucherCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const isExist = await this.promotionModel.findOne({ voucherCode });
    if (isExist) return this.generateVoucherCode();
    return voucherCode;
  }
}
