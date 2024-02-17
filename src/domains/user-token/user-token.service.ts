import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { SALT_ROUNDS } from 'src/app.config';
import { UserToken } from './schema/user-token.schema';

@Injectable()
export class UserTokenService {
  constructor(
    @InjectModel(UserToken.name)
    private readonly userTokenModel: Model<UserToken>,
  ) {}

  async upsert(userId: string, refreshToken: string) {
    const userToken = await this.userTokenModel.findOne(
      { userId: userId },
      {},
      { lean: true },
    );
    const hashedRT = await bcrypt.hash(refreshToken, SALT_ROUNDS);

    userToken
      ? await this.userTokenModel.findOneAndUpdate(
          { userId: userId },
          { hashedRefreshToken: hashedRT },
          { lean: true, new: true },
        )
      : await this.userTokenModel.create({
          userId: userId,
          hashedRefreshToken: hashedRT,
        });
  }

  async delete(userId: string) {
    return await this.userTokenModel.findOneAndDelete(
      { userId },
      { lean: true },
    );
  }

  async findByUserId(userId: string) {
    return await this.userTokenModel.findOne({ userId }, {}, { lean: true });
  }
}
