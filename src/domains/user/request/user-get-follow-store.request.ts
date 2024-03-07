import { IsOptional, IsString } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { User } from '../schema/user.schema';

export class UserGetFollowStoreREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  static toQueryCondition(user: User, search: string) {
    const condition = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { address: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        }
      : {};
    return { ...condition, _id: { $in: user.followStores } };
  }
}
