import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PAYMENT_METHOD } from 'shared/enums/bill.enum';
import { CartInfoDTO } from '../dto/cart-info.dto';
import { GiveInfoDTO } from '../dto/give-info.dto';
import { ReceiverInfoDTO } from '../dto/receiver-info.dto';
import { Bill } from '../schema/bill.schema';

export class BillCreateREQ {
  @IsNotEmpty()
  @Type(() => CartInfoDTO)
  @IsArray()
  data: CartInfoDTO[];

  @IsNotEmpty()
  @IsString()
  deliveryMethod: string;

  @IsNotEmpty()
  @IsEnum(PAYMENT_METHOD)
  paymentMethod: PAYMENT_METHOD;

  @IsNotEmpty()
  receiverInfo: ReceiverInfoDTO;

  @IsOptional()
  giveInfo: GiveInfoDTO | null;

  @IsOptional()
  @IsString()
  promotionId: string;

  @IsOptional()
  @IsNumber()
  coins: number;

  @IsNotEmpty()
  @IsNumber()
  totalPayment: number;

  static saveData(newBill: Bill, userId: string, body: BillCreateREQ, paymentId: string) {
    newBill.userId = userId;
    newBill.deliveryMethod = body.deliveryMethod;
    newBill.paymentMethod = body.paymentMethod;
    newBill.receiverInfo = body.receiverInfo;
    if (body.giveInfo) newBill.giveInfo = body.giveInfo;
    newBill.paymentId = paymentId;
    newBill.save();
  }
}
