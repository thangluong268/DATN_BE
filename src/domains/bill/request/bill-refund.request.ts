import { IsString } from 'class-validator';

export class BillRefundREQ {
  @IsString()
  billId: string;

  @IsString()
  reasonRefund: string;
}
