import { IsOptional } from 'class-validator';

export class GetCategoryREQ {
  @IsOptional()
  status: boolean;

  static toQueryCondition(query: GetCategoryREQ) {
    const { status } = query;
    const condition = {};
    if (status !== undefined) {
      condition['status'] = status;
    }
    return condition;
  }
}
