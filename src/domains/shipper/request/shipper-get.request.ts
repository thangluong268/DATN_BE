import { IsOptional, IsString } from 'class-validator';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { BooleanValidator } from 'shared/validators/boolean-query.validator';
import { isBlank } from 'shared/validators/query.validator';

export class ShipperGetREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @BooleanValidator()
  status: boolean;

  static toCondition(query: ShipperGetREQ) {
    const { search, status } = query;
    const condition = { role: ROLE_NAME.SHIPPER };
    if (!isBlank(status)) {
      condition['status'] = status;
    }
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
