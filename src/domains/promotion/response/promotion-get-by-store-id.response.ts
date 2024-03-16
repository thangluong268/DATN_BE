import { Promotion } from '../schema/promotion.schema';

export class PromotionGetByStoreIdRESP {
  id: string;
  avatar: string;
  voucherCode: string;
  minSpend: number;
  value: number;
  startTime: Date;
  endTime: Date;
  usagePercent: number;
  static of(promotion: Promotion): PromotionGetByStoreIdRESP {
    return {
      id: promotion._id,
      avatar: promotion.avatar,
      voucherCode: promotion.voucherCode,
      minSpend: promotion.minSpend,
      value: promotion.value,
      startTime: promotion.startTime,
      endTime: promotion.endTime,
      usagePercent: Math.floor(promotion.userUses.length / promotion.quantity),
    };
  }
}
