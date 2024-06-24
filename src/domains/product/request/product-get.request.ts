import { IsOptional, IsString } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';

export class ProductsGetREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  static toQueryCondition(storeId: string, query: ProductsGetREQ, status: any) {
    const { search } = query;
    const storeIdQuery = storeId ? { storeId } : {};
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { keywords: { $regex: search, $options: 'i' } },
            { storeName: { $regex: search, $options: 'i' } },
            { categoryName: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const condition = { ...storeIdQuery, ...searchQuery, ...status };
    return condition;
  }
}
