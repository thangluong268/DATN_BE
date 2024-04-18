import { IsOptional, IsString } from 'class-validator';

export class PolicyUpdateREQ {
  @IsOptional()
  @IsString()
  content: string;
}
