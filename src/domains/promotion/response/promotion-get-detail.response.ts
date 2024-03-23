import { Promotion } from '../schema/promotion.schema';

export class PromotionGetDetailRESP {
  id: string;
  avatar: string;
  voucherCode: string;
  minSpend: number;
  quantity: number;
  value: number;
  maxDiscountValue: number;
  storeIds: string[];
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  static of(promotion: Promotion): PromotionGetDetailRESP {
    return {
      id: promotion._id,
      avatar: promotion.avatar,
      voucherCode: promotion.voucherCode,
      minSpend: promotion.minSpend,
      quantity: promotion.quantity,
      value: promotion.value,
      maxDiscountValue: promotion.maxDiscountValue,
      storeIds: promotion.storeIds,
      startTime: promotion.startTime,
      endTime: promotion.endTime,
      isActive: promotion.isActive,
    };
  }
}
