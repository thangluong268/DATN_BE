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
import * as dayjs from 'dayjs';
import { Bill } from 'domains/bill/schema/bill.schema';
import { Store } from 'domains/store/schema/store.schema';
import { NotificationSubjectInfoDTO } from 'gateways/notifications/dto/notification-subject-info.dto';
import { NotificationGateway } from 'gateways/notifications/notification.gateway';
import { NotificationService } from 'gateways/notifications/notification.service';
import { NotificationUpdateREQ } from 'gateways/notifications/request/notification-update.request';
import { Model } from 'mongoose';
import { NOTIFICATION_LINK } from 'shared/constants/notification.constant';
import { SOCIAL_APP } from 'shared/constants/user.constant';
import { BILL_STATUS } from 'shared/enums/bill.enum';
import { NotificationType } from 'shared/enums/notification.enum';
import { PolicyType } from 'shared/enums/policy.enum';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { createExcelFile } from 'shared/helpers/excel.helper';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { ForgetPassREQ } from '../auth/request/forget-password.request';
import { AuthSignUpREQ } from '../auth/request/sign-up.request';
import { USER_DATA } from './data/sample.data';
import { UserDownloadExcelDTO } from './dto/user-download-excel.dto';
import { UsersHaveStoreDownloadExcelDTO } from './dto/users-have-store-download-excel.dto';
import { UserBannedGetREQ } from './request/user-banned-get.request';
import { UserCreateREQ } from './request/user-create.request';
import { UserGetFollowStoreREQ } from './request/user-get-follow-store.request';
import { UserGetPagingREQ } from './request/user-get-paging.resquest';
import { UsersHaveStoreREQ } from './request/user-have-store.request';
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

    @InjectModel(Bill.name)
    private readonly billModel: Model<Bill>,

    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
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
    return UserCreateRESP.of(toDocModel(newUser));
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
    return UserCreateRESP.of(toDocModel(newUser));
  }

  async createUserSocial(body: any) {
    const newUser = await this.userModel.create({ ...body, role: [ROLE_NAME.USER] });
    return toDocModel(newUser);
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id, { socialApp: 0, socialId: 0 }, { lean: true });
    user?.address?.sort((a, b) => (b.default ? 1 : -1) - (a.default ? 1 : -1));
    return user;
  }

  async findStoreByUserId(userId: string) {
    return await this.storeModel.findOne({ userId }).lean();
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

    // Send notification
    const subjectInfo = NotificationSubjectInfoDTO.ofUser(updatedUser);
    const receiverId = updatedUser._id.toString();
    const link = NOTIFICATION_LINK[NotificationType.UPDATE_INFO];
    const notification = await this.notificationService.create(receiverId, subjectInfo, NotificationType.UPDATE_INFO, link);
    this.notificationGateway.sendNotification(receiverId, notification);

    return BaseResponse.withMessage(toDocModel(updatedUser), 'Cập nhật thông tin thành công!');
  }

  async getDetail(id: string) {
    this.logger.log(`Get Detail: ${id}`);
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng này!');
    const billsOfUser = await this.billModel.find({ userId: id }).lean();
    const totalBills = billsOfUser.length;
    const totalPricePaid = billsOfUser.reduce((total, bill) => total + bill.totalPricePayment, 0);
    const totalReceived = billsOfUser.filter((bill) => bill.totalPriceInit === 0).length;
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
    const data = await this.billModel.aggregate([
      { $match: { status: BILL_STATUS.DELIVERED } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: Number(limit) },
      { $addFields: { userObjId: { $toObjectId: '$_id' } } },
      {
        $lookup: {
          from: 'users',
          localField: 'userObjId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $addFields: { totalBills: '$count', user: { $arrayElemAt: ['$user', 0] } } },
      {
        $project: {
          _id: 0,
          user: {
            _id: 1,
            avatar: 1,
            fullName: 1,
            email: 1,
            password: 1,
            address: 1,
            phone: 1,
            gender: 1,
            birthday: 1,
            role: 1,
            friends: 1,
            followStores: 1,
            wallet: 1,
            warningCount: 1,
            createdAt: 1,
            updatedAt: 1,
          },
          totalBills: 1,
        },
      },
    ]);
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
        const billsOfUser = await this.billModel.find({ userId: user._id.toString() }).lean();
        const totalBills = billsOfUser.length;
        const totalPricePaid = billsOfUser.reduce((total, bill) => total + bill.totalPricePayment, 0);
        const totalReceived = billsOfUser.filter((bill) => bill.totalPriceInit === 0).length;
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
    if (store.userId.toString() === userId.toString())
      throw new BadRequestException('Bạn không thể theo dõi cửa hàng của chính mình!');
    const user = await this.userModel.findById(userId).lean();
    const index = user.followStores.findIndex((id) => id.toString() === storeId.toString());
    index === -1 ? user.followStores.push(storeId) : user.followStores.splice(index, 1);
    await this.userModel.findByIdAndUpdate(userId, { followStores: user.followStores });

    const notification = await this.notificationService.getOne(store.userId, userId, NotificationType.FOLLOW);
    const oneDayAgo = dayjs().subtract(1, 'day');
    const isBefore = notification && dayjs(notification['createdAt']).isBefore(oneDayAgo);
    if (index === -1 && (!notification || isBefore)) {
      // Send notification
      const subjectInfo = NotificationSubjectInfoDTO.ofUser(user);
      const receiverId = store.userId;
      const link = NOTIFICATION_LINK[NotificationType.FOLLOW];
      const newNotification = await this.notificationService.create(receiverId, subjectInfo, NotificationType.FOLLOW, link);
      this.notificationGateway.sendNotification(receiverId, newNotification);
    }
    return BaseResponse.withMessage({}, index === -1 ? 'Follow cửa hàng thành công!' : 'Hủy follow cửa hàng thành công!');
  }

  async acceptOrUnFriend(receiverId: string, senderId: string) {
    this.logger.log(`Accept Or UnFriend`);
    if (receiverId === senderId) throw new BadRequestException('Bạn không thể kết bạn với chính mình!');
    const receiver = await this.findById(receiverId);
    const sender = await this.findById(senderId);
    const index = receiver.friends.findIndex((id) => id.toString() === sender.toString());
    index === -1 ? receiver.friends.push(senderId) : receiver.friends.splice(index, 1);
    await this.userModel.findByIdAndUpdate(receiverId, { friends: receiver.friends });

    if (index === 1) return BaseResponse.withMessage({}, 'Hủy kết bạn thành công!');

    // Receiver side
    const notificationReceiver = await this.notificationService.getOne(receiverId, senderId, NotificationType.SENT_ADD_FRIEND);
    const body = {
      notificationId: notificationReceiver._id,
      content: this.notificationService.getContent(NotificationType.ACCEPTED_ADD_FRIEND_OF_RECEIVER),
      type: NotificationType.ACCEPTED_ADD_FRIEND_OF_RECEIVER,
    } as NotificationUpdateREQ;
    const updatedNotification = await this.notificationService.update(body);
    this.notificationGateway.sendNotification(receiverId, updatedNotification);

    // Sender side
    const subjectInfo = NotificationSubjectInfoDTO.ofUser(receiver);
    const link = '';
    const newNotificationSender = await this.notificationService.create(
      senderId, // receiverId
      subjectInfo,
      NotificationType.ACCEPTED_ADD_FRIEND_OF_SENDER,
      link,
    );
    this.notificationGateway.sendNotification(senderId, newNotificationSender);

    return BaseResponse.withMessage({}, 'Kết bạn thành công!');
  }

  async rejectAddFriend(receiverId: string, senderId: string) {
    this.logger.log(`Reject Add Friend`);
    if (receiverId === senderId) throw new BadRequestException('Không thể thực hiện!');

    // Receiver side
    const notificationReceiver = await this.notificationService.getOne(receiverId, senderId, NotificationType.SENT_ADD_FRIEND);
    const body = {
      notificationId: notificationReceiver._id,
      content: this.notificationService.getContent(NotificationType.REJECT_ADD_FRIEND),
      type: NotificationType.REJECT_ADD_FRIEND,
    } as NotificationUpdateREQ;
    const updatedNotification = await this.notificationService.update(body);
    this.notificationGateway.sendNotification(receiverId, updatedNotification);

    return BaseResponse.withMessage({}, 'Từ chối lời mời kết bạn thành công!');
  }

  async getUsersHasStore(query: UsersHaveStoreREQ) {
    this.logger.log(`Get Users Has Store`);
    const data = await this.userModel.aggregate(UsersHaveStoreREQ.toFind(query));
    const total = await this.userModel.aggregate(UsersHaveStoreREQ.toCount());
    return PaginationResponse.ofWithTotalAndMessage(
      data,
      total[0]?.total || 0,
      'Lấy danh sách người dùng có cửa hàng thành công!',
    );
  }

  async getUsersHasBeenWarning(query: PaginationREQ) {
    this.logger.log(`Get Users Has Been Warning`);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const [data, total] = await Promise.all([
      this.userModel.aggregate([
        { $match: { warningCount: { $gt: 0 } } },
        {
          $lookup: {
            from: 'reports',
            let: { userId: { $toString: '$_id' } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$subjectId', '$$userId'] },
                  type: PolicyType.USER,
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
              { $project: { _id: 1, createdAt: 1 } },
            ],
            as: 'reports',
          },
        },
        { $addFields: { latestReport: { $first: '$reports' } } },
        { $sort: { 'latestReport.createdAt': -1 } },
        { $project: { socialApp: 0, socialId: 0, reports: 0, latestReport: 0 } },
        { $skip: skip },
        { $limit: limit },
      ]),
      this.userModel.countDocuments({ warningCount: { $gt: 0 } }),
    ]);
    return PaginationResponse.ofWithTotalAndMessage(data, total, 'Lấy danh sách người dùng bị cảnh cáo thành công!');
  }

  async getUsersBanned(query: UserBannedGetREQ) {
    this.logger.log(`Get Users Banned`);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const condition = UserBannedGetREQ.toCondition(query);
    const [data, total] = await Promise.all([
      this.userModel
        .find(condition, { socialApp: 0, socialId: 0 }, { lean: true })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      this.userModel.countDocuments(condition),
    ]);
    return PaginationResponse.ofWithTotalAndMessage(data, total, 'Lấy danh sách người dùng bị vô hiệu hóa thành công!');
  }

  /**
   * Excel download
   */

  async downloadExcelUsers() {
    this.logger.log(`Download Excel Users`);
    const users = await this.userModel.find(
      { role: { $nin: [ROLE_NAME.ADMIN, ROLE_NAME.MANAGER] } },
      { password: 0, friends: 0, followStores: 0 },
      { lean: true },
    );
    const headers = UserDownloadExcelDTO.getSheetValue();
    const dataRows = users.map(UserDownloadExcelDTO.fromEntity);
    return createExcelFile<UserDownloadExcelDTO>(`Users - ${dayjs().format('YYYY-MM-DD')}`, headers, dataRows);
  }

  async downloadExcelUsersHaveStore() {
    this.logger.log(`Download Excel Users Have Store`);
    const pipeline = UsersHaveStoreREQ.toPipeline() as any[];
    pipeline.push({ $sort: { joinDate: -1 } });
    const users = await this.userModel.aggregate(pipeline);
    const headers = UsersHaveStoreDownloadExcelDTO.getSheetValue();
    const dataRows = users.map(UsersHaveStoreDownloadExcelDTO.fromEntity);
    return createExcelFile<UsersHaveStoreDownloadExcelDTO>(
      `Users have store - ${dayjs().format('YYYY-MM-DD')}`,
      headers,
      dataRows,
    );
  }

  async downloadExcelUsersBeingWarned() {
    this.logger.log(`Download Excel Users Being Warned`);
    const users = await this.userModel.find(
      { role: { $nin: [ROLE_NAME.ADMIN, ROLE_NAME.MANAGER] }, warningCount: { $gt: 0, $lt: 3 } },
      { password: 0, friends: 0, followStores: 0 },
      { lean: true },
    );
    const headers = UserDownloadExcelDTO.getSheetValue();
    const dataRows = users.map(UserDownloadExcelDTO.fromEntity);
    return createExcelFile<UserDownloadExcelDTO>(`Users Being Warned - ${dayjs().format('YYYY-MM-DD')}`, headers, dataRows);
  }

  async downloadExcelUsersDeactivated() {
    this.logger.log(`Download Excel Users Deactivated`);
    const users = await this.userModel.find(
      { role: { $nin: [ROLE_NAME.ADMIN, ROLE_NAME.MANAGER] }, status: false },
      { password: 0, friends: 0, followStores: 0 },
      { lean: true },
    );
    const headers = UserDownloadExcelDTO.getSheetValue();
    const dataRows = users.map(UserDownloadExcelDTO.fromEntity);
    return createExcelFile<UserDownloadExcelDTO>(`Users Deactivated - ${dayjs().format('YYYY-MM-DD')}`, headers, dataRows);
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
