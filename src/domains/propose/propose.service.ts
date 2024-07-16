import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { StoreWallet } from 'domains/store-wallet/schema/store-wallet.schema';
import { Store } from 'domains/store/schema/store.schema';
import { ObjectId } from 'mongodb';
import { Connection, Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { ProposeCreateREQ } from './request/propose-create.request';
import { ProposeGetRESP } from './response/propose-get.response';
import { Propose } from './schema/propose.schema';

@Injectable()
export class ProposeService {
  private readonly logger = new Logger(ProposeService.name);
  constructor(
    @InjectModel(Propose.name)
    private readonly proposeModel: Model<Propose>,

    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,

    @InjectModel(StoreWallet.name)
    private readonly storeWalletModel: Model<StoreWallet>,

    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async create(body: ProposeCreateREQ) {
    this.logger.log(`Create propose`);
    const newPropose = await this.proposeModel.create(body);
    return BaseResponse.withMessage(ProposeGetRESP.of(newPropose), 'Tạo gói đề xuất thành công');
  }

  async getProposes() {
    this.logger.log(`Get proposes`);
    const proposes = await this.proposeModel.find({ status: true });
    return BaseResponse.withMessage(
      proposes.map((propose) => ProposeGetRESP.of(propose)),
      'Lấy danh sách gói đề xuất thành công',
    );
  }

  async purchase(userReq: any, id: string) {
    this.logger.log(`Purchase propose`);
    const store = await this.storeModel.findOne({ userId: userReq._id.toString() }).lean();
    const storeWallet = await this.storeWalletModel.findOne({ storeId: store._id.toString() }).lean();
    const propose = await this.proposeModel.findById(id).lean();
    if (!propose) throw new NotFoundException('Không tìm thấy gói đề xuất');
    if (storeWallet.wallet < propose.price) throw new BadRequestException('Ví của bạn không đủ để mua gói đề xuất này');
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.storeWalletModel.updateOne({ storeId: store._id.toString() }, { $inc: { wallet: -propose.price } }, { session });
      await this.proposeModel.findByIdAndUpdate(id, { $push: { storeIds: store._id.toString() } }, { session });
      await session.commitTransaction();
      return BaseResponse.withMessage({}, 'Mua gói đề xuất thành công');
    } catch (err) {
      await session.abortTransaction();
      throw new BadRequestException(err.message);
    } finally {
      await session.endSession();
    }
  }

  async getStoreProposes() {
    this.logger.log(`Get store proposes`);
    const proposes = await this.proposeModel.find({ status: true }).select('storeIds').lean();
    const storeIdsPropose = Array.from(new Set(proposes.map((propose) => propose.storeIds).flat())).map(
      (storeId) => new ObjectId(storeId),
    );
    const storeProposes = await this.storeModel.find({ _id: { $in: storeIdsPropose } }).lean();
    const data = storeProposes.map((store) => ({
      id: store._id.toString(),
      name: store.name,
      avatar: store.avatar,
      address: store.address,
      phoneNumber: store.phoneNumber,
    }));
    return BaseResponse.withMessage(data, 'Lấy danh sách cửa hàng đã mua gói đề xuất thành công');
  }
}
