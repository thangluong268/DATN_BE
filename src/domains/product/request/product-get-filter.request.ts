import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';

export class ProductGetFilterREQ extends PaginationREQ {
  @IsNotEmpty()
  @IsString()
  search: string;

  @IsOptional()
  priceMin?: number;

  @IsOptional()
  priceMax?: number;

  @IsOptional()
  quantityMin?: number;

  @IsOptional()
  quantityMax?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  createdAtMin?: Date;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  createdAtMax?: Date;

  static toQueryCondition(query: ProductGetFilterREQ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { search, page, limit, ...filterQuery } = query;
    let condition: any = {};
    if (search) {
      condition.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { keywords: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { storeName: { $regex: search, $options: 'i' } },
        { categoryId: { $regex: search, $options: 'i' } },
      ];
    }
    if (filterQuery) {
      const filter = {};
      if (filterQuery.priceMin && filterQuery.priceMax) {
        filter['newPrice'] = { $gte: Number(filterQuery.priceMin), $lte: Number(filterQuery.priceMax) };
      }
      if (filterQuery.quantityMin && filterQuery.quantityMax) {
        filter['quantity'] = { $gte: Number(filterQuery.quantityMin), $lte: Number(filterQuery.quantityMax) };
      }
      if (filterQuery.createdAtMin && filterQuery.createdAtMax) {
        filter['createdAt'] = { $gte: new Date(filterQuery.createdAtMin), $lte: new Date(filterQuery.createdAtMax) };
      }
      condition = { ...condition, ...filter };
    }
    return condition;
  }
}
