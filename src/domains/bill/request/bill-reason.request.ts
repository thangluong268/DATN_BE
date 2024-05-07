import { IsString } from 'class-validator';

export class BillReasonREQ {
  @IsString()
  reason: string;
}
