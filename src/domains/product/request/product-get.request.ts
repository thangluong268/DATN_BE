import { IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { PaginationREQ } from 'shared/generics/pagination.request';

export class ProductsGetREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  sortType: string;

  @IsOptional()
  @IsString()
  sortValue: string;

  static toQueryCondition(storeId: string, query: ProductsGetREQ, status: any) {
    const { search } = query;
    const storeIdQuery = storeId ? { storeId: storeId } : {};
    const searchQuery = search
      ? {
          $or: [
            {
              _id: Types.ObjectId.isValid(search) === true ? search.toString() : new Types.ObjectId(),
            },
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { keywords: { $regex: search, $options: 'i' } },
            { type: { $regex: search, $options: 'i' } },
            { storeName: { $regex: search, $options: 'i' } },
            {
              categoryId: Types.ObjectId.isValid(search) === true ? search.toString() : new Types.ObjectId(),
            },
          ],
        }
      : {};

    const condition = { ...storeIdQuery, ...searchQuery, ...status };
    return condition;
  }

  static toSortCondition(query: ProductsGetREQ) {
    const { sortType, sortValue } = query;
    const sortTypeQuery = sortType ? sortType : 'desc';
    const sortValueQuery = sortValue ? sortValue : 'name';
    return { sortTypeQuery, sortValueQuery };
  }
}
