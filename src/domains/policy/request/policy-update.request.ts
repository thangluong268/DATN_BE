import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PolicyType } from 'shared/enums/policy.enum';

export class PolicyUpdateREQ {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(PolicyType)
  type: PolicyType;
}
