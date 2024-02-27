import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { SALT_ROUNDS } from 'app.config';
import * as bcrypt from 'bcrypt';
import { Connection, Model } from 'mongoose';
import { SOCIAL_APP } from 'shared/constants/user.constant';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { BaseResponse } from 'shared/generics/base.response';
import { ForgetPassREQ } from '../auth/request/forget-password.request';
import { AuthSignUpREQ } from '../auth/request/sign-up.request';
import { UserCreateREQ } from './request/user-create.request';
import { UserUpdateREQ } from './request/user-update.request';
import { UserCreateRESP } from './response/user-create.response';
import { User } from './schema/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async createUserSystem(body: AuthSignUpREQ) {
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
    const newUser = await this.userModel.create({
      ...body,
      role: [ROLE_NAME.USER],
    });

    return User.toDocModel(newUser);
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id, {}, { lean: true });
    user?.address?.sort((a, b) => (b.default ? 1 : -1) - (a.default ? 1 : -1));
    return user;
  }

  async findOneByEmailSystem(email: string) {
    const user = await this.userModel.findOne(
      { email, socialId: null, socialApp: null },
      {},
      { lean: true },
    );
    user?.address?.sort((a, b) => (b.default ? 1 : -1) - (a.default ? 1 : -1));
    return user;
  }

  async findOneBySocial(
    email: string,
    socialId: string,
    socialApp: SOCIAL_APP,
  ) {
    const user = await this.userModel.findOne(
      { email, socialId, socialApp },
      {},
      { lean: true },
    );
    user?.address?.sort((a, b) => (b.default ? 1 : -1) - (a.default ? 1 : -1));
    return user;
  }

  async updatePassword(body: ForgetPassREQ) {
    const { email, password } = body;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return await this.userModel.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { lean: true, new: true },
    );
  }

  async updateById(id: string, body: UserUpdateREQ, user: User) {
    if (user.role.includes(ROLE_NAME.USER) && user._id.toString() !== id) {
      return new ForbiddenException(
        'Bạn không có quyền cập nhật thông tin người dùng khác!',
      );
    }
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { ...body },
      { lean: true, new: true },
    );
    return BaseResponse.withMessage<User>(
      User.toDocModel(updatedUser),
      'Cập nhật thông tin thành công!',
    );
  }

  async getDetail(id: string) {
    const user = await this.findById(id);
    return BaseResponse.withMessage<User>(user, 'Lấy thông tin thành công!');
  }
}
