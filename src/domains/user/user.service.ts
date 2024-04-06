import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SALT_ROUNDS } from 'app.config';
import * as bcrypt from 'bcrypt';
import { BillService } from 'domains/bill/bill.service';
import { BillUser } from 'domains/bill/schema/bill-user.schema';
import { Store } from 'domains/store/schema/store.schema';
import { Model } from 'mongoose';
import { SOCIAL_APP } from 'shared/constants/user.constant';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { ForgetPassREQ } from '../auth/request/forget-password.request';
import { AuthSignUpREQ } from '../auth/request/sign-up.request';
import { USER_DATA } from './data/sample.data';
import { UserCreateREQ } from './request/user-create.request';
import { UserGetFollowStoreREQ } from './request/user-get-follow-store.request';
import { UserGetPagingREQ } from './request/user-get-paging.resquest';
import { UserUpdateREQ } from './request/user-update.request';
import { UserCreateRESP } from './response/user-create.response';
import { User } from './schema/user.schema';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,

    @InjectModel(BillUser.name)
    private readonly billUserModel: Model<BillUser>,
    private readonly billService: BillService,
  ) {}

  async createUserSystem(body: AuthSignUpREQ) {
    this.logger.log(`Create User System: ${body.email}`);
    const hashedPassword = await bcrypt.hash(body.password, SALT_ROUNDS);
    body.password = hashedPassword;
    const user = await this.findOneByEmailSystem(body.email);
    if (user) {
      throw new ConflictException('Email đã tồn tại!');
    }
    const newUser = await this.userModel.create(body);
    AuthSignUpREQ.setDefault(newUser);
    await newUser.save();
    return UserCreateRESP.of(User.toDocModel(newUser));
  }

  async createUserWithoutRole(body: UserCreateREQ) {
    this.logger.log(`Create User Without Role: ${body.email}`);
    const hashedPassword = await bcrypt.hash(body.password, SALT_ROUNDS);
    body.password = hashedPassword;
    const user = await this.findOneByEmailSystem(body.email);
    if (user) {
      throw new ConflictException('Email đã tồn tại!');
    }
    const newUser = await this.userModel.create(body);
    UserCreateREQ.setDefault(newUser);
    await newUser.save();
    return UserCreateRESP.of(User.toDocModel(newUser));
  }

  async createUserSocial(body: any) {
    const newUser = await this.userModel.create({ ...body, role: [ROLE_NAME.USER] });
    return User.toDocModel(newUser);
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id, { socialApp: 0, socialId: 0 }, { lean: true });
    user?.address?.sort((a, b) => (b.default ? 1 : -1) - (a.default ? 1 : -1));
    return user;
  }

  async findOneByEmailSystem(email: string) {
    const user = await this.userModel.findOne(
      { email, socialId: null, socialApp: null },
      { socialApp: 0, socialId: 0 },
      { lean: true },
    );
    user?.address?.sort((a, b) => (b.default ? 1 : -1) - (a.default ? 1 : -1));
    return user;
  }

  async findOneBySocial(email: string, socialId: string, socialApp: SOCIAL_APP) {
    const user = await this.userModel.findOne({ email, socialId, socialApp }, { socialApp: 0, socialId: 0 }, { lean: true });
    user?.address?.sort((a, b) => (b.default ? 1 : -1) - (a.default ? 1 : -1));
    return user;
  }

  async updatePassword(body: ForgetPassREQ) {
    const { email, password } = body;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return await this.userModel.findOneAndUpdate({ email }, { password: hashedPassword }, { lean: true, new: true });
  }

  async updateById(id: string, body: UserUpdateREQ, user: User) {
    this.logger.log(`Update User By Id: ${id}`);
    if (user.role.includes(ROLE_NAME.USER) && user._id.toString() !== id) {
      throw new ForbiddenException('Bạn không có quyền cập nhật thông tin người dùng khác!');
    }
    const updatedUser = await this.userModel.findByIdAndUpdate(id, { ...body }, { lean: true, new: true });
    return BaseResponse.withMessage<User>(User.toDocModel(updatedUser), 'Cập nhật thông tin thành công!');
  }

  async getDetail(id: string) {
    this.logger.log(`Get Detail: ${id}`);
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng này!');
    const billsOfUser = await this.billUserModel.find({ userId: id }).lean();
    const totalBills = billsOfUser.length;
    const totalPricePaid = billsOfUser.reduce((total, bill) => total + bill.totalPayment, 0);
    const totalReceived = billsOfUser.filter((bill) => bill.totalPayment === 0).length;
    const data = { ...user, totalBills, totalPricePaid, totalReceived };
    return BaseResponse.withMessage(data, 'Lấy thông tin thành công!');
  }

  async updateWallet(id: string, money: number, type: string) {
    const user = await this.userModel.findById(id, {}, { lean: true });
    const bonus = Math.floor((money * 0.2) / 1000);
    const updatedWallet = type == 'plus' ? user.wallet + bonus : user.wallet - bonus;
    await this.userModel.findByIdAndUpdate(id, { wallet: updatedWallet }, { lean: true, new: true });
  }

  async countTotal() {
    return await this.userModel.countDocuments();
  }

  async getUsersHaveMostBill(limit: number = 5) {
    this.logger.log(`Get Users Have Most Bill: ${limit}`);
    const bills = await this.billService.getUsersHaveMostBill(Number(limit));
    const data = await Promise.all(
      bills.map(async (item: any) => {
        const user = await this.userModel.findById(
          item._id,
          { status: 0, updatedAt: 0, socialApp: 0, socialId: 0 },
          { lean: true },
        );
        if (!user) return;
        return { user, totalBills: item.count };
      }),
    );
    return BaseResponse.withMessage(data, 'Lấy thông tin danh sách người dùng mua hàng nhiều nhất thành công!');
  }

  async getUsersFollowStore(userId: string, query: UserGetFollowStoreREQ) {
    this.logger.log(`Get Users Follow Store: ${userId}`);
    const user = await this.userModel.findById(userId).lean();
    const condition = UserGetFollowStoreREQ.toQueryCondition(user, query.search);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.storeModel.countDocuments(condition);
    const stores = await this.storeModel.find(condition).limit(limit).skip(skip);
    // Sort the stores based on the order in user.followStores
    const orderMap = new Map(user.followStores.reverse().map((id, index) => [id.toString(), index]));
    stores.sort((a, b) => orderMap.get(a._id.toString()) - orderMap.get(b._id.toString()));
    return PaginationResponse.ofWithTotalAndMessage(stores, total, 'Lấy thông tin danh sách cửa hàng theo dõi thành công!');
  }

  async getUsersNoPaging(limit: number = 50) {
    this.logger.log(`Get Users No Paging: ${limit}`);
    const users = await this.userModel
      .find({ role: { $nin: [ROLE_NAME.ADMIN, ROLE_NAME.MANAGER] } }, { socialApp: 0, socialId: 0 }, { lean: true })
      .limit(Number(limit));
    const data = await Promise.all(
      users.map(async (item) => {
        const user = await this.userModel.findById(item._id).lean();
        if (!user) return;
        const billsOfUser = await this.billUserModel.find({ userId: user._id.toString() }).lean();
        const totalBills = billsOfUser.length;
        const totalPricePaid = billsOfUser.reduce((total, bill) => total + bill.totalPayment, 0);
        const totalReceived = billsOfUser.filter((bill) => bill.totalPayment === 0).length;
        return { ...user, totalBills, totalPricePaid, totalReceived };
      }),
    );
    return BaseResponse.withMessage(data, 'Lấy danh sách người dùng thành công!');
  }

  async getUsersPaging(query: UserGetPagingREQ) {
    this.logger.log(`Get Users Paging: ${JSON.stringify(query)}`);
    const condition = UserGetPagingREQ.toQueryCondition(query.search);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.userModel.countDocuments(condition);
    const users = await this.userModel
      .find(condition, { socialApp: 0, socialId: 0 }, { lean: true })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);
    users.forEach((user) => {
      user?.address.sort((a, b) => (b.default ? 1 : -1) - (a.default ? 1 : -1));
      return user;
    });
    return PaginationResponse.ofWithTotalAndMessage(users, total, 'Lấy danh sách người dùng thành công!');
  }

  async followStore(userId: string, storeId: string) {
    this.logger.log(`Follow Store: ${userId} - ${storeId}`);
    const store = await this.storeModel.findById(storeId).lean();
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    if (store.userId.toString() === userId) throw new BadRequestException('Bạn không thể theo dõi cửa hàng của chính mình!');
    const user = await this.userModel.findById(userId).lean();
    const index = user.followStores.findIndex((id) => id.toString() === storeId.toString());
    index == -1 ? user.followStores.push(storeId) : user.followStores.splice(index, 1);
    await this.userModel.findByIdAndUpdate(userId, { followStores: user.followStores });
    return BaseResponse.withMessage({}, index == -1 ? 'Follow cửa hàng thành công!' : 'Hủy follow cửa hàng thành công!');
  }

  async addFriend(userIdSend: string, userIdReceive: string) {
    this.logger.log(`Add Friend: ${userIdSend} - ${userIdReceive}`);
    const userReceive = await this.findById(userIdReceive);
    if (!userReceive) throw new NotFoundException('Không tìm thấy người dùng này!');
    if (userIdReceive === userIdSend) throw new BadRequestException('Bạn không thể kết bạn với chính mình!');
    const userSend = await this.findById(userIdSend);
    const index = userSend.friends.findIndex((id) => id.toString() === userIdReceive.toString());
    index == -1 ? userSend.friends.push(userIdReceive) : userSend.friends.splice(index, 1);
    await this.userModel.findByIdAndUpdate(userIdSend, { friends: userSend.friends });
    return BaseResponse.withMessage({}, index == -1 ? 'Kết bạn thành công!' : 'Hủy kết bạn thành công!');
  }

  async getUsersHasStore(query: PaginationREQ) {
    this.logger.log(`Get Users Has Store`);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const pipeline = [
      { $addFields: { idString: { $toString: '$_id' } } },
      {
        $lookup: {
          from: 'stores',
          localField: 'idString',
          foreignField: 'userId',
          as: 'store',
        },
      },
      { $match: { store: { $ne: [] } } },
      { $project: { store: 0, socialApp: 0, socialId: 0, idString: 0 } },
    ];
    const [data, total] = await Promise.all([
      this.userModel.aggregate([...pipeline, { $limit: limit }, { $skip: skip }]),
      this.userModel.aggregate([...pipeline, { $count: 'total' }]),
    ]);
    return PaginationResponse.ofWithTotalAndMessage(
      data,
      total[0]?.total || 0,
      'Lấy danh sách người dùng có cửa hàng thành công!',
    );
  }

  /**
   * Seed data
   */

  async seedData() {
    await this.userModel.insertMany(USER_DATA);
  }

  async updateAvatar() {
    await this.userModel.updateMany({}, { avatar: 'https://static-00.iconduck.com/assets.00/user-icon-2048x2048-ihoxz4vq.png' });
  }
}
