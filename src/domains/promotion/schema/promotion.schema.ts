import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// id
// voucherCode: người dùng nhập để sử dụng
// minSpend: giá trị đơn tối thiểu
// quantity: số lượng voucher
// value: giá trị của voucher
// label: điều kiện sử dụng voucher
// productLimits: những produc được chỉ định để sử dụng
// orderLimit: số lượng đơn tối thiểu
// storeId
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
  voucherCode: string;

  @Prop({ type: Number })
  minSpend: number;

  @Prop({ type: Number })
  quantity: number;

  @Prop({ type: Number })
  value: number;

  @Prop({ type: String })
  label: string;

  @Prop({ type: [String], default: [] })
  productLimits: string[];

  @Prop({ type: Number, default: 0 })
  orderLimit: number;

  @Prop({ type: String })
  storeId: string;

  @Prop({ type: [String], default: [] })
  userSaves: string[];

  @Prop({ type: [String], default: [] })
  userUses: string[];

  @Prop({ type: Date })
  startTime: Date;

  @Prop({ type: Date })
  endTime: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);
