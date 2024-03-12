import { IsNotEmpty, IsOptional } from 'class-validator';
import { PAYMENT_METHOD } from 'shared/enums/bill.enum';
import { CartInfoDTO } from '../dto/cart-info.dto';
import { GiveInfoDTO } from '../dto/give-info.dto';
import { ReceiverInfoDTO } from '../dto/receiver-info.dto';
import { Bill } from '../schema/bill.schema';

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

  static saveData(newBill: Bill, userId: string, body: BillCreateREQ, paymentId: string) {
    newBill.userId = userId;
    newBill.deliveryMethod = body.deliveryMethod;
    newBill.paymentMethod = body.paymentMethod;
    newBill.receiverInfo = body.receiverInfo;
    if (body.giveInfo) newBill.giveInfo = body.giveInfo;
    newBill.deliveryFee = body.deliveryFee;
    newBill.paymentId = paymentId;
    newBill.save();
  }
}
