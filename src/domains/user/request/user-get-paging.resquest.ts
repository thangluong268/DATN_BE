import { IsOptional, IsString } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';

export class UserGetPagingREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  static toQueryCondition(search: string) {
    const query = search
      ? {
          $or: [
            { fullName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
          ],
        }
      : {};
    return query;
  }
}
