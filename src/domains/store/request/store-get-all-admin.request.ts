import { IsOptional, IsString } from 'class-validator';
import { PaginationREQ } from 'src/shared/generics/pagination.request';

export class GetStoresByAdminREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  static toQueryCondition(query: GetStoresByAdminREQ) {
    const search = query.search;
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
    return condition;
  }
}
