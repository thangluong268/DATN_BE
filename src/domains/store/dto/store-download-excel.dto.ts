import * as dayjs from 'dayjs';
import { ExcelSheetValue } from 'shared/helpers/type.helper';

export class StoreDownloadExcelDTO {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  name: string;
  address: string;
  phoneNumber: string;
  description: string;
  warningCount: string;
  status: boolean;
  createdAt: string;

  static fromEntity(store: any): StoreDownloadExcelDTO {
    return {
      id: store._id.toString(),
      userId: store.userId.toString(),
      userName: store.userName,
      avatar: store.avatar,
      name: store.name,
      address: store.address,
      phoneNumber: store.phoneNumber.map((phone, index) => `Số điện thoại ${index + 1}: ${phone}`).join('\n'),
      description: store.description,
      warningCount: store.warningCount,
      status: store.status,
      createdAt: dayjs(store['createdAt']).format('YYYY-MM-DD'),
    };
  }

  static getSheetValue(): ExcelSheetValue<StoreDownloadExcelDTO> {
    return {
      id: { name: 'ID', width: 30 },
      userId: { name: 'ID Chủ cửa hàng', width: 30 },
      userName: { name: 'Tên chủ cửa hàng', width: 30 },
      avatar: { name: 'Ảnh cửa hàng', width: 50 },
      name: { name: 'Tên cửa hàng', width: 30 },
      address: { name: 'Địa chỉ', width: 50 },
      phoneNumber: { name: 'Số điện thoại', width: 35 },
      description: { name: 'Mô tả', width: 50 },
      warningCount: { name: 'Số lần bị cảnh báo', width: 25 },
      status: { name: 'Trạng thái hoạt động', width: 25 },
      createdAt: { name: 'Ngày đăng ký', width: 25 },
    };
  }
}
