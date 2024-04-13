import { IsOptional, IsString } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';

export class UserBannedGetREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  static toCondition(query: UserBannedGetREQ) {
    const { search } = query;
    const condition = { status: false };
    if (search) {
      query['$or'] = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    return condition;
  }
}
