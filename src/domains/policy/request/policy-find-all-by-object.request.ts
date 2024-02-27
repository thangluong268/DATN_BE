import { IsEnum, IsNotEmpty } from 'class-validator';
import { PolicyObject } from 'shared/enums/policy.enum';

export class PolicyFindAllByObjectREQ {
  @IsNotEmpty()
  @IsEnum(PolicyObject)
  policyObject: PolicyObject;
}
