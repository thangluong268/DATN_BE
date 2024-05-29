import { IsOptional, IsString } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';

export class ProductsGetLoveREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  static toQueryConditionFindProduct(query: ProductsGetLoveREQ) {
    const { search } = query;
    const condition: any = { status: true };
    if (search) {
      condition.$or = [
        { name: { $regex: search, $options: 'i' } },
        // { description: { $regex: search, $options: 'i' } },
        { keywords: { $regex: search, $options: 'i' } },
        // { type: { $regex: search, $options: 'i' } },
      ];
    }
    return condition;
  }

  static toQueryConditionFindEvaluation(userId: string, productIds: string[]) {
    return { 'emojis.userId': userId, productId: { $in: productIds } };
  }
}
