import { AddressProfile, User } from '../schema/user.schema';

export class UserCreateRESP {
  _id: string;
  fullName: string;
  email: string;
  address: AddressProfile[];
  role: string[];
  friends: string[];
  followStores: string[];
  wallet: number;
  warningCount: number;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  avatar: string;

  static of(user: User): UserCreateRESP {
    return {
      _id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      address: user.address,
      role: user.role,
      friends: user.friends,
      followStores: user.followStores,
      wallet: user.wallet,
      warningCount: user.warningCount,
      status: user.status,
      createdAt: user['createdAt'],
      updatedAt: user['updatedAt'],
      avatar: user.avatar,
    };
  }
}
