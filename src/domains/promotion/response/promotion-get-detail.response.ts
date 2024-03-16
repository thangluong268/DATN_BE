import { Promotion } from '../schema/promotion.schema';

export class PromotionGetDetailRESP {
  id: string;
  voucherCode: string;
  minSpend: number;
  quantity: number;
  value: number;
  label: string;
  productLimits: string[];
  orderLimit: number;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  static of(promotion: Promotion): PromotionGetDetailRESP {
    return {
      id: promotion._id,
      voucherCode: promotion.voucherCode,
      minSpend: promotion.minSpend,
      quantity: promotion.quantity,
      value: promotion.value,
      label: promotion.label,
      productLimits: promotion.productLimits,
      orderLimit: promotion.orderLimit,
      startTime: promotion.startTime,
      endTime: promotion.endTime,
      isActive: promotion.isActive,
    };
  }
}
