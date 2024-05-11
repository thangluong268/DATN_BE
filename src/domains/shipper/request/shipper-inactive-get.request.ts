import { IsOptional, IsString } from 'class-validator';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';

export class ShipperInActiveGetREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  static toCondition(query: ShipperInActiveGetREQ) {
    const { search } = query;
    const condition = { status: false, role: ROLE_NAME.SHIPPER };
    if (search) {
      condition['$or'] = [
        { fullName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { emailShipper: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
        { addressShipper: { $regex: query.search, $options: 'i' } },
      ];
    }
    return condition;
  }
}
