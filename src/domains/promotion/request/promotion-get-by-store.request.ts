import { IsOptional } from 'class-validator';

export class PromotionGetByStore {
  @IsOptional()
  isActive: boolean;

  static toQueryCondition(storeId: string, query: PromotionGetByStore) {
    const { isActive } = query;
    const condition = { storeId: storeId.toString() };
    if (isActive !== undefined) {
      condition['isActive'] = isActive;
    }
    return condition;
  }
}
