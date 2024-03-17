import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PolicyType } from 'shared/enums/policy.enum';

export class PolicyFindAllByObjectREQ {
  @IsNotEmpty()
  @IsEnum(PolicyType)
  type: PolicyType;

  @IsOptional()
  @IsString()
  search: string;

  static toQueryCondition(query: PolicyFindAllByObjectREQ) {
    const { search, type } = query;
    const condition: any = { type };
    if (search) {
      condition.$or = [{ name: { $regex: search, $options: 'i' } }, { content: { $regex: search, $options: 'i' } }];
    }
    return condition;
  }
}
