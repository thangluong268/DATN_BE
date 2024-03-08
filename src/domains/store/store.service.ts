import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { User } from '../user/schema/user.schema';
import { UserService } from '../user/user.service';
import { StoreCreateREQ } from './request/store-create.request';
import { GetStoresByAdminREQ } from './request/store-get-all-admin.request';
import { StoreUpdateREQ } from './request/store-update.request';
import { Store } from './schema/store.schema';

@Injectable()
export class StoreService {
  constructor(
    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async create(userId: string, body: StoreCreateREQ) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng này!');

    const store = await this.storeModel.findOne({ userId }, {}, { lean: true });
    if (store) throw new NotFoundException('Người dùng đã có cửa hàng!');

    const newStore = await this.storeModel.create({ userId, ...body });

    await this.userModel.updateOne({ _id: userId }, { role: [...user.role, ROLE_NAME.SELLER] });

    return BaseResponse.withMessage<Store>(newStore, 'Tạo cửa hàng thành công!');
  }

  async getMyStore(userId: string) {
    const store = await this.storeModel.findOne({ userId }, {}, { lean: true });
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng!');

    return BaseResponse.withMessage<Store>(store, 'Lấy thông tin cửa hàng thành công!');
  }

  async getStores(query: GetStoresByAdminREQ) {
    const condition = GetStoresByAdminREQ.toQueryCondition(query);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.storeModel.countDocuments(condition);
    const stores = await this.storeModel.find(condition).sort({ createdAt: -1 }).limit(limit).skip(skip);

    return PaginationResponse.ofWithTotalAndMessage(
      stores.map((store) => Store.toDocModel(store)),
      total,
      'Lấy danh sách cửa hàng thành công!',
    );
  }

  async update(userId: string, body: StoreUpdateREQ) {
    const store = await this.storeModel.findOne({ userId }, {}, { lean: true });
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng!');
    const updatedStore = await this.storeModel.findOneAndUpdate({ userId }, { ...body }, { lean: true, new: true });
    return BaseResponse.withMessage<Store>(updatedStore, 'Cập nhật thông tin cửa hàng thành công!');
  }

  async findByUserId(userId: string) {
    return await this.storeModel.findOne({ userId }, {}, { lean: true });
  }

  async findById(id: string) {
    return await this.storeModel.findById(id, {}, { lean: true });
  }

  async countTotal() {
    return await this.storeModel.countDocuments();
  }
}
