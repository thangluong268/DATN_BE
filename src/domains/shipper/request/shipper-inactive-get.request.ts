import { IsOptional, IsString } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';

export class ShipperInActiveGetREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  static toCondition(query: ShipperInActiveGetREQ) {
    const { search } = query;
    const condition = { isActive: false };
    if (search) {
      condition['$or'] = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
        { address: { $regex: query.search, $options: 'i' } },
      ];
    }
    return condition;
  }
}
