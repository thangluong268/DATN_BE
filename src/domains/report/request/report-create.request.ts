import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PolicyType } from 'shared/enums/policy.enum';

export class ReportCreateREQ {
  @IsNotEmpty()
  @IsString()
  subjectId: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsEnum(PolicyType)
  type: PolicyType;
}
