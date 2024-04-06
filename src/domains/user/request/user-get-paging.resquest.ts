import { IsOptional, IsString } from 'class-validator';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';

export class UserGetPagingREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  static toQueryCondition(search: string) {
    const query = search
      ? {
          role: { $nin: [ROLE_NAME.ADMIN, ROLE_NAME.MANAGER] },
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
