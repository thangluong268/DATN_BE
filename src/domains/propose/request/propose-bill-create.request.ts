import { IsEnum } from 'class-validator';
import { PAYMENT_METHOD } from 'shared/enums/bill.enum';

export class ProposeBillCreateREQ {
  @IsEnum(PAYMENT_METHOD)
  paymentMethod: PAYMENT_METHOD;
}
