import { IsNotEmpty } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';

export class BillGetAllByStatusUserREQ extends PaginationREQ {
  @IsNotEmpty()
  status: string;

  static toQueryCondition(userId: string, query: BillGetAllByStatusUserREQ) {
    return { userId, status: query.status.toUpperCase() };
  }
}
