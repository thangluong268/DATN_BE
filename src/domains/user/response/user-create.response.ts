import { AddressProfile, User } from '../schema/user.schema';

export class UserCreateRESP {
  fullName: string;
  email: string;
  address: AddressProfile[];
  role: string[];
  friends: string[];
  followStores: string[];
  wallet: number;
  warningCount: number;
  status: string;
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  avatar: string;

  static of(user: User): UserCreateRESP {
    return {
      fullName: user.fullName,
      email: user.email,
      address: user.address,
      role: user.role,
      friends: user.friends,
      followStores: user.followStores,
      wallet: user.wallet,
      warningCount: user.warningCount,
      status: user.status,
      _id: user._id,
      createdAt: user['createdAt'],
      updatedAt: user['updatedAt'],
      avatar: user.avatar,
    };
  }
}
