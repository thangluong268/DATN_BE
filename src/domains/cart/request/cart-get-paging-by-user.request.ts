import { IsOptional, IsString } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';

export class CartGetPagingByUserREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  static toQueryCondition(userId: string, query: CartGetPagingByUserREQ) {
    const { search } = query;
    const condition = search
      ? {
          $or: [
            { storeName: { $regex: search, $options: 'i' } },
            { products: { $elemMatch: { name: { $regex: search, $options: 'i' } } } },
          ],
        }
      : {};
    return { ...condition, userId };
  }
}
