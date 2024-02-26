import { IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { PaginationREQ } from 'shared/generics/pagination.request';

export class GetProductsREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  storeId: string;

  @IsOptional()
  @IsString()
  sortType: string;

  @IsOptional()
  @IsString()
  sortValue: string;

  static toQueryCondition(query: GetProductsREQ, status: any) {
    const { search, storeId } = query;
    const storeIdQuery = storeId ? { storeId: storeId } : {};
    const searchQuery = search
      ? {
          $or: [
            {
              _id:
                Types.ObjectId.isValid(search) === true
                  ? search.toString()
                  : new Types.ObjectId(),
            },
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { keywords: { $regex: search, $options: 'i' } },
            { type: { $regex: search, $options: 'i' } },
            { storeName: { $regex: search, $options: 'i' } },
            {
              categoryId:
                Types.ObjectId.isValid(search) === true
                  ? search.toString()
                  : new Types.ObjectId(),
            },
          ],
        }
      : {};

    const condition = { ...storeIdQuery, ...searchQuery, ...status };
    return condition;
  }

  static toSortCondition(query: GetProductsREQ) {
    const { sortType, sortValue } = query;
    const sortTypeQuery = sortType ? sortType : 'desc';
    const sortValueQuery = sortValue ? sortValue : 'productName';
    return { sortTypeQuery, sortValueQuery };
  }
}
