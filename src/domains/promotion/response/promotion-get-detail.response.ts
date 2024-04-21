export interface StorePromotionRESP {
  id: string;
  name: string;
  avatar: string;
}

export interface UserPromotionRESP {
  id: string;
  fullName: string;
  avatar: string;
  numOfUsed: number;
}

export class PromotionGetDetailRESP {
  id: string;
  avatar: string;
  voucherCode: string;
  minSpend: number;
  quantity: number;
  value: number;
  maxDiscountValue: number;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  stores: StorePromotionRESP[];
  users: UserPromotionRESP[];
  static of(promotion: any, users: UserPromotionRESP[]): PromotionGetDetailRESP {
    return {
      id: promotion._id,
      avatar: promotion.avatar,
      voucherCode: promotion.voucherCode,
      minSpend: promotion.minSpend,
      quantity: promotion.quantity,
      value: promotion.value,
      maxDiscountValue: promotion.maxDiscountValue,
      startTime: promotion.startTime,
      endTime: promotion.endTime,
      isActive: promotion.isActive,
      stores: promotion.stores.map((store) => ({
        id: store._id,
        name: store.name,
        avatar: store.avatar,
      })),
      users,
    };
  }
}
