export class PromotionUpdateREQ {
  voucherCode: string;
  minSpend: number;
  quantity: number;
  value: number;
  label: string;
  productLimits: string[];
  orderLimit: number;
  userSaves: string[];
  userUses: string[];
  startTime: Date;
  endTime: Date;
  isActive: boolean;
}
