import { IsNotEmpty } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';

export class BillGetAllByStatusSellerREQ extends PaginationREQ {
  @IsNotEmpty()
  status: string;

  static toQueryCondition(storeId: string, query: BillGetAllByStatusSellerREQ) {
    return { storeId, status: query.status.toUpperCase() };
  }
}
