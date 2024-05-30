import { Promotion } from '../schema/promotion.schema';

export class PromotionGetMyRESP {
  id: string;
  avatar: string;
  voucherCode: string;
  minSpend: number;
  value: number;
  maxDiscountValue: number;
  startTime: Date;
  endTime: Date;
  usagePercent: number;
  isActive: boolean;
  static of(promotion: Promotion): PromotionGetMyRESP {
    return {
      id: promotion._id,
      avatar: promotion.avatar,
      voucherCode: promotion.voucherCode,
      minSpend: promotion.minSpend,
      value: promotion.value,
      maxDiscountValue: promotion.maxDiscountValue,
      startTime: promotion.startTime,
      endTime: promotion.endTime,
      usagePercent: promotion.userUses.length / promotion.quantity,
      isActive: promotion.isActive,
    };
  }
}
