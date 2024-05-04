import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as dayjs from 'dayjs';
import { Store } from 'domains/store/schema/store.schema';
import { User } from 'domains/user/schema/user.schema';
import * as _ from 'lodash';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { createExcelFile } from 'shared/helpers/excel.helper';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { isBlank } from 'shared/validators/query.validator';
import { PromotionDownloadExcelDTO } from './dto/promotion-download-excel.dto';
import { PromotionCreateREQ } from './request/promotion-create.request';
import { PromotionGetByManagerFilterREQ } from './request/promotion-get-by-manager-filter.request';
import { PromotionGetByStore } from './request/promotion-get-by-store.request';
import { PromotionGetUserUsesREQ } from './request/promotion-get-user-use.request';
import { PromotionUpdateREQ } from './request/promotion-update.request';
import { PromotionGetByStoreIdRESP } from './response/promotion-get-by-store-id.response';
import { PromotionGetDetailRESP, UserPromotionRESP } from './response/promotion-get-detail.response';
import { PromotionGetMyRESP } from './response/promotion-get-my.response';
import { Promotion } from './schema/promotion.schema';
import { promotionCreateValidate } from './validates/promotion-create.validate';

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
    this.logger.log(`Create promotion by userId: ${userId}, body: ${JSON.stringify(body)}`);
    promotionCreateValidate(body);
    const voucherCode = await this.generateVoucherCode();
    return await this.promotionModel.create({ ...body, voucherCode });
  }

  async getPromotionsByStoreId(user: any, storeId: string) {
    this.logger.log(`storeId: ${storeId}`);
    const promotions = await this.promotionModel.aggregate([
      { $match: { storeIds: storeId, isActive: true } },
      { $addFields: { isSaved: user ? { $in: [user.userId.toString(), '$userSaves'] } : false } },
      { $project: { createdAt: 0, updatedAt: 0, userSaves: 0 } },
    ]);
    const data = promotions.map((promotion) => PromotionGetByStoreIdRESP.of(promotion));
    return BaseResponse.withMessage(data, 'Lấy danh sách khuyến mãi của cửa hàng thành công!');
  }

  async getPromotionsByManager(query: PaginationREQ, filter: PromotionGetByManagerFilterREQ) {
    this.logger.log(`get promotions by manager`);
    if (filter.storeId) {
      const store = await this.storeModel.findById(filter.storeId).lean();
      if (!store) throw new NotFoundException('Không tìm thấy cửa hàng!');
    }
    const condition = PromotionGetByManagerFilterREQ.toFilter(filter);
    const total = await this.promotionModel.countDocuments(condition);
    const data = await this.promotionModel.aggregate(PromotionGetByManagerFilterREQ.toFind(query, condition) as any);
    return PaginationResponse.ofWithTotalAndMessage(data, total, 'Lấy danh sách khuyến mãi thành công!');
  }

  async getMyPromotions(userId: string, query: PromotionGetByStore) {
    this.logger.log(`Lấy danh sách khuyến mãi của cửa hàng bản thân: userId: ${userId}`);
    const store = await this.storeModel.findOne({ userId }).lean();
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng!');
    const condition = PromotionGetByStore.toQueryCondition(store._id, query);
    const promotions = await this.promotionModel.find(condition, { createdAt: 0, updatedAt: 0, userSaves: 0 }).lean();
    const data = promotions.map((promotion) => PromotionGetMyRESP.of(promotion));
    return BaseResponse.withMessage(data, 'Lấy danh sách khuyến mãi của cửa hàng thành công!');
  }

  async getPromotion(promotionId: string) {
    this.logger.log(`get detail promotionId: ${promotionId}`);
    const isExistPromotion = await this.promotionModel.findById(promotionId).lean();
    if (!isExistPromotion) throw new NotFoundException('Không tìm thấy khuyến mãi!');
    const promotion = await this.promotionModel.aggregate([
      { $match: { _id: new ObjectId(promotionId) } },
      {
        $lookup: {
          from: 'stores',
          let: { storeIds: '$storeIds' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$_id', { $map: { input: '$$storeIds', as: 'storeId', in: { $toObjectId: '$$storeId' } } }] },
              },
            },
            { $project: { _id: 1, name: 1, avatar: 1 } },
          ],
          as: 'stores',
        },
      },
    ]);
    const countNumOfUsedByUserId = promotion[0].userUses.reduce((map, currentValue) => {
      map[currentValue] = (map[currentValue] || 0) + 1;
      return map;
    }, {});
    const userIdsWithNumOfUsed = Object.keys(countNumOfUsedByUserId).map((key) => ({
      id: key,
      count: countNumOfUsedByUserId[key],
    }));
    const usersWithNumOfUsed = await Promise.all(
      userIdsWithNumOfUsed.map(async (item) => {
        const user = await this.userModel.findById(item.id).lean();
        return {
          id: user._id,
          fullName: user.fullName,
          avatar: user.avatar,
          numOfUsed: item.count,
        } as UserPromotionRESP;
      }),
    );
    if (isBlank(promotion)) throw new NotFoundException('Không tìm thấy khuyến mãi!');
    return BaseResponse.withMessage(
      PromotionGetDetailRESP.of(promotion[0], usersWithNumOfUsed),
      'Lấy thông tin chi tiết khuyến mãi thành công!',
    );
  }

  async getUserUsesPromotion(userId: string, userRole: string[], promotionId: string, query: PromotionGetUserUsesREQ) {
    this.logger.log(`get user uses promotionId: ${promotionId}`);
    const promotion = await this.promotionModel.findById(promotionId).lean();
    if (!promotion) throw new NotFoundException('Không tìm thấy khuyến mãi!');
    if (!(userRole.includes(ROLE_NAME.MANAGER) || userRole.includes(ROLE_NAME.ADMIN))) {
      const store = await this.storeModel.findOne({ userId }).lean();
      if (!store) throw new NotFoundException('Không tìm thấy cửa hàng!');
      if (!promotion.storeIds.includes(store._id.toString())) throw new NotFoundException('Không tìm thấy khuyến mãi!');
    }
    const promotionObjId = new ObjectId(promotionId);
    const conditionToTal = PromotionGetUserUsesREQ.toTotalQuery(promotionObjId);
    const conditionFind = PromotionGetUserUsesREQ.toFindUsers(promotionObjId, query);
    const total = await this.promotionModel.aggregate(conditionToTal);
    const data = await this.promotionModel.aggregate(conditionFind);
    return PaginationResponse.ofWithTotalAndMessage(
      _.uniqWith(data, _.isEqual),
      total[0]?.total || 0,
      'Lấy danh sách người dùng sử dụng khuyến mãi thành công!',
    );
  }

  async getPromotionsByUser(userId: string, storeIds: string[]) {
    this.logger.log(`get promotion by user in: ${storeIds}`);
    const promotions = await this.promotionModel.aggregate([
      { $match: { startTime: { $lte: new Date() }, isActive: true, storeIds: { $in: storeIds } } },
      { $addFields: { isSaved: { $in: [userId.toString(), '$userSaves'] } } },
      { $project: { createdAt: 0, updatedAt: 0, userSaves: 0, storeIds: 0 } },
    ]);
    const data = promotions.map((promotion) => PromotionGetByStoreIdRESP.of(promotion));
    return BaseResponse.withMessage(data, 'Lấy danh sách khuyến mãi thành công!');
  }

  async getPromotionsNotUsed(query: PaginationREQ) {
    this.logger.log(`get promotions not used`);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.promotionModel.countDocuments({ isActive: true, userUses: { $size: 0 } });
    const data = await this.promotionModel
      .find({ endTime: { $gte: new Date() }, isActive: true, userUses: { $size: 0 } }, { createdAt: 0, updatedAt: 0 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return PaginationResponse.ofWithTotalAndMessage(data, total, 'Lấy danh sách khuyến mãi chưa sử dụng thành công!');
  }

  async update(promotionId: string, body: PromotionUpdateREQ) {
    this.logger.log(`update promotionId: ${promotionId}, body: ${JSON.stringify(body)}`);
    const promotion = await this.promotionModel.findById(promotionId).lean();
    if (!promotion) throw new NotFoundException('Không tìm thấy khuyến mãi!');
    await this.promotionModel.findByIdAndUpdate(promotionId, { ...body });
    return BaseResponse.withMessage({}, 'Cập nhật khuyến mãi thành công!');
  }

  async delete(promotionId: string) {
    this.logger.log(`Delete promotionId: ${promotionId}`);
    const promotion = await this.promotionModel.findById(promotionId).lean();
    if (!promotion) throw new NotFoundException('Không tìm thấy khuyến mãi!');
    if (promotion.userUses.length > 0) throw new BadRequestException('Khuyến mãi đã được sử dụng, không thể xóa!');
    await this.promotionModel.findByIdAndDelete(promotionId);
    return BaseResponse.withMessage({}, 'Xóa khuyến mãi thành công!');
  }

  async handleSaveVoucher(userId: string, promotionId: string) {
    this.logger.log(`save voucher: ${promotionId}`);
    const promotion = await this.promotionModel.findOne({ _id: promotionId, isActive: true }).lean();
    if (!promotion) throw new NotFoundException('Không tìm thấy khuyến mãi!');
    if (promotion.userUses.includes(userId)) throw new BadRequestException('Bạn đã sử dụng khuyến mãi này rồi!');
    let message = '';
    if (promotion.userSaves.includes(userId.toString())) {
      await this.promotionModel.findByIdAndUpdate(promotionId, { $pull: { userSaves: userId } });
      message = 'Hủy lưu khuyến mãi thành công!';
    } else {
      await this.promotionModel.findByIdAndUpdate(promotionId, { $push: { userSaves: userId } });
      message = 'Lưu khuyến mãi thành công!';
    }
    return BaseResponse.withMessage({}, message);
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

  /**
   * Excel Download
   */

  async downloadExcelPromotion(storeId: string) {
    this.logger.log('download excel promotion');
    const promotions = await this.promotionModel.aggregate([
      { $match: storeId ? { storeIds: storeId } : {} },
      {
        $lookup: {
          from: 'stores',
          let: { storeIds: '$storeIds' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$_id', { $map: { input: '$$storeIds', as: 'storeId', in: { $toObjectId: '$$storeId' } } }] },
              },
            },
            { $project: { _id: 1, name: 1, avatar: 1 } },
          ],
          as: 'stores',
        },
      },
    ]);
    const headers = PromotionDownloadExcelDTO.getSheetValue();
    const dataRows = promotions.map(PromotionDownloadExcelDTO.fromEntity);
    return createExcelFile<PromotionDownloadExcelDTO>(`Promotions - ${dayjs().format('YYYY-MM-DD')}`, headers, dataRows);
  }
}
