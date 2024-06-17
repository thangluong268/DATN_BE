import { IsOptional, IsString } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { leanObject } from 'shared/parsers/io.parser';

export class ProductGetFilterREQ extends PaginationREQ {
  @IsString()
  categoryId: string;

  @IsOptional()
  priceMin?: number;

  @IsOptional()
  priceMax?: number;

  @IsOptional()
  quantityMin?: number;

  @IsOptional()
  quantityMax?: number;

  @IsOptional()
  createdAtMin?: Date;

  @IsOptional()
  createdAtMax?: Date;

  static toQueryCondition(query: ProductGetFilterREQ) {
    const condition: any = { status: true, categoryId: query.categoryId };
    condition.newPrice = {
      $gte: query.priceMin ? Number(query.priceMin) : undefined,
      $lte: query.priceMax ? Number(query.priceMax) : undefined,
    };
    condition.quantity = {
      $gte: query.quantityMin ? Number(query.quantityMin) : undefined,
      $lte: query.quantityMax ? Number(query.quantityMax) : undefined,
    };
    condition.createdAt = {
      $gte: query.createdAtMin ? new Date(query.createdAtMin) : undefined,
      $lte: query.createdAtMax ? new Date(query.createdAtMax) : undefined,
    };
    return leanObject(condition);
  }
}
