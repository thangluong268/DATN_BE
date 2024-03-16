import { Promotion } from '../schema/promotion.schema';

export class PromotionGetByStoreIdRESP {
  id: string;
  voucherCode: string;
  minSpend: number;
  value: number;
  label: string;
  startTime: Date;
  endTime: Date;
  usagePercent: number;
  static of(promotion: Promotion): PromotionGetByStoreIdRESP {
    return {
      id: promotion._id,
      voucherCode: promotion.voucherCode,
      minSpend: promotion.minSpend,
      value: promotion.value,
      label: promotion.label,
      startTime: promotion.startTime,
      endTime: promotion.endTime,
      usagePercent: Math.floor(promotion.userUses.length / promotion.quantity),
    };
  }
}
