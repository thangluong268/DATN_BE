import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PolicyObject } from 'shared/enums/policy.enum';

export class PolicyCreateREQ {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsEnum(PolicyObject)
  policyObject: PolicyObject;
}
