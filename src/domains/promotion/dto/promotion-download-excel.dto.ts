import * as dayjs from 'dayjs';
import { ExcelSheetValue } from 'shared/helpers/type.helper';

export class PromotionDownloadExcelDTO {
  id: string;
  avatar: string;
  voucherCode: string;
  minSpend: number;
  quantity: number;
  value: number;
  maxDiscountValue: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  stores: string;

  static fromEntity(promotion: any): PromotionDownloadExcelDTO {
    return {
      id: promotion._id.toString(),
      avatar: promotion.avatar,
      voucherCode: promotion.voucherCode,
      minSpend: promotion.minSpend,
      quantity: promotion.quantity,
      value: promotion.value,
      maxDiscountValue: promotion.maxDiscountValue,
      startTime: dayjs(promotion.startTime).format('YYYY-MM-DD'),
      endTime: dayjs(promotion.endTime).format('YYYY-MM-DD'),
      isActive: promotion.isActive,
      stores: promotion.stores
        .map((store, index) => `Cửa hàng ${index + 1}:\nID: ${store._id}\nTên: ${store.name}\nẢnh đại diện: ${store.avatar}`)
        .join('\n'),
    };
  }

  static getSheetValue(): ExcelSheetValue<PromotionDownloadExcelDTO> {
    return {
      id: { name: 'ID', width: 30 },
      avatar: { name: 'Ảnh voucher', width: 50 },
      voucherCode: { name: 'Voucher Code', width: 30 },
      minSpend: { name: 'Giá trị tối thiểu', width: 30 },
      quantity: { name: 'Số lượng', width: 30 },
      value: { name: 'Phần trăm giảm', width: 30 },
      maxDiscountValue: { name: 'Giảm giá tối đa', width: 30 },
      startTime: { name: 'Ngày bắt đầu', width: 25 },
      endTime: { name: 'Ngày kết thúc', width: 25 },
      isActive: { name: 'Trạng thái', width: 25 },
      stores: { name: 'Cửa hàng được áp dụng', width: 100 },
    };
  }
}
