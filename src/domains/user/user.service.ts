import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Connection, Model } from 'mongoose';
import { SALT_ROUNDS } from 'src/app.config';
import { ROLES } from 'src/shared/constants/role.constant';
import { ForgetPassREQ } from '../auth/request/forget-password.request';
import { AuthSignUpREQ } from '../auth/request/sign-up.request';
import { User } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async createUser(body: AuthSignUpREQ) {
    const hashedPassword = await bcrypt.hash(body.password, SALT_ROUNDS);
    body.password = hashedPassword;

    const newUser = await this.userModel.create(body);
    newUser.avatar =
      'https://res.cloudinary.com/dl3b2j3td/image/upload/v1702564956/TLCN/ov6t50kl5npfmwfopzrk.png';
    newUser.role = [ROLES.USER];
    await newUser.save();

    return User.toDocModel(newUser);
  }

  async findById(id: string) {
    return await this.userModel.findById(id, {}, { lean: true });
  }

  async findOneByEmail(email: string) {
    return await this.userModel.findOne({ email }, {}, { lean: true });
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
}
