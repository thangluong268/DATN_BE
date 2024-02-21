import { IsOptional, IsString } from 'class-validator';

export class GetCategoriesREQ {
  @IsOptional()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  status: string;

  static toQueryCondition(query: GetCategoriesREQ) {
    const { id, status } = query;
    const condition = id ? { _id: id } : {};
    if (status) {
      condition['status'] = Boolean(status);
    }
    return condition;
  }
}
