import { TAX_RATE } from 'app.config';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PAYMENT_METHOD } from 'shared/enums/bill.enum';
import { CartInfoDTO } from '../dto/cart-info.dto';
import { GiveInfoDTO } from '../dto/give-info.dto';
import { ReceiverInfoDTO } from '../dto/receiver-info.dto';

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

  static toCreateBillSeller(cart: CartInfoDTO, userId: string, body: BillCreateREQ, paymentId: string) {
    return {
      userId: userId,
      storeId: cart.storeId,
      products: cart.products,
      notes: cart.notes,
      deliveryFee: cart.deliveryFee,
      totalPrice: cart.totalPrice,
      deliveryMethod: body.deliveryMethod,
      paymentMethod: body.paymentMethod,
      receiverInfo: body.receiverInfo,
      giveInfo: body.giveInfo ? body.giveInfo : undefined,
      paymentId: paymentId,
    };
  }

  static toCreateBillUser(
    userId: string,
    body: BillCreateREQ,
    paymentId: string,
    totalPrice: number,
    totalDeliveryFee: number,
    discountValue: number,
  ) {
    return {
      userId,
      data: body.data,
      deliveryMethod: body.deliveryMethod,
      paymentMethod: body.paymentMethod,
      receiverInfo: body.receiverInfo,
      giveInfo: body.giveInfo ? body.giveInfo : undefined,
      promotionId: body.promotionId ? body.promotionId : undefined,
      coins: body.coins ? body.coins : 0,
      initTotalPayment: body['initTotalPayment'],
      totalPayment: totalPrice,
      totalDeliveryFee,
      discountValue,
      paymentId,
    };
  }

  static toCreateTax(storeId: string, totalPrice: number, paymentId: string) {
    return {
      storeId,
      totalPrice,
      totalTax: totalPrice * TAX_RATE,
      paymentId,
    };
  }
}
