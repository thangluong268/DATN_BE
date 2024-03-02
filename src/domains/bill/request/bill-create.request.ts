import { IsNotEmpty, IsOptional } from 'class-validator';
import { PAYMENT_METHOD } from 'shared/enums/bill.enum';
import { CartInfoDTO } from '../dto/cart-info.dto';
import { GiveInfoDTO } from '../dto/give-info.dto';
import { ReceiverInfoDTO } from '../dto/receiver-info.dto';

export class BillCreateREQ {
  @IsNotEmpty()
  data: CartInfoDTO[];

  @IsNotEmpty()
  deliveryMethod: string;

  @IsNotEmpty()
  paymentMethod: PAYMENT_METHOD;

  @IsNotEmpty()
  receiverInfo: ReceiverInfoDTO;

  @IsOptional()
  giveInfo: GiveInfoDTO | null;

  @IsNotEmpty()
  deliveryFee: number;

  // static create(userId: string);
}
