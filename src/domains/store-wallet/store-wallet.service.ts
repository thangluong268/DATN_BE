import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Store } from 'domains/store/schema/store.schema';
import { Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { StoreWallet } from './schema/store-wallet.schema';

@Injectable()
export class StoreWalletService {
  private readonly logger = new Logger(StoreWalletService.name);
  constructor(
    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,

    @InjectModel(StoreWallet.name)
    private readonly storeWalletModel: Model<StoreWallet>,
  ) {}

  async createWallet() {
    this.logger.log(`Create wallet for stores`);
    const stores = await this.storeModel.find().select('_id').lean();
    const storeIds = stores.map((store) => store._id);
    for (const storeId of storeIds) {
      await this.storeWalletModel.create({ storeId });
    }
  }

  async getWallet(userReq: any) {
    this.logger.log(`Get wallet of store`);
    const store = await this.storeModel.findOne({ userId: userReq._id.toString() }).select('_id').lean();
    const storeWallet = await this.storeWalletModel.findOne({ storeId: store._id.toString() }).lean();
    return BaseResponse.withMessage(storeWallet.wallet, 'Lấy ví tiền cửa hàng thành công');
  }
}
