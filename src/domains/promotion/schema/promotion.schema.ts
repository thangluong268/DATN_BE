import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// id
// voucherCode: người dùng nhập để sử dụng
// minSpend: giá trị đơn tối thiểu
// quantity: số lượng voucher
// value: giá trị của voucher (%)
// maxDiscountValue: giá trị tối đa mà voucher có thể giảm
// storeIds: những cửa hàng áp dụng
// userSaves: những user đã lưu mã
// userUses: những user đã sử dụng
// endTime: ngày kết thúc
// createdAt: ngày bắt đầu

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Promotion extends Document {
  @Prop({ type: String })
  avatar: string;

  @Prop({ type: String })
  voucherCode: string;

  @Prop({ type: Number })
  minSpend: number;

  @Prop({ type: Number })
  quantity: number;

  @Prop({ type: Number })
  value: number;

  @Prop({ type: Number })
  maxDiscountValue: number;

  @Prop({ type: [String] })
  storeIds: string[];

  @Prop({ type: [String], default: [] })
  userSaves: string[];

  @Prop({ type: [String], default: [] })
  userUses: string[];

  @Prop({ type: Date })
  startTime: Date;

  @Prop({ type: Date })
  endTime: Date;

  @Prop({ type: Boolean, default: false })
  isActive: boolean;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);
