import * as dayjs from 'dayjs';
import { ExcelSheetValue } from 'shared/helpers/type.helper';

export class UsersHaveStoreDownloadExcelDTO {
  id: string;
  avatar: string;
  fullName: string;
  email: string;
  storeId: string;
  storeName: string;
  storeAvatar: string;
  joinDate: string;
  address: string;
  phone: string;
  gender: string;
  birthday: string;
  role: string;
  wallet: number;
  warningCount: number;
  status: boolean;
  createdAt: string;

  static fromEntity(user: any): UsersHaveStoreDownloadExcelDTO {
    return {
      id: user._id.toString(),
      avatar: user.avatar,
      fullName: user.fullName,
      email: user.email,
      storeId: user.storeId.toString(),
      storeName: user.storeName,
      storeAvatar: user.storeAvatar,
      joinDate: dayjs(user.joinDate).format('YYYY-MM-DD'),
      address: user.address
        .map(
          (address, index) =>
            `Hồ sơ địa chỉ ${index + 1}:\nNgười nhận: ${address.receiverName}\nSố điện thoại: ${address.receiverPhone}\nĐịa chỉ: ${address.address}`,
        )
        .join('\n'),
      phone: user.phone,
      gender: user.gender,
      birthday: dayjs(user.birthday).format('YYYY-MM-DD'),
      role: user.role.map((role) => role).join('\n'),
      wallet: user.wallet,
      warningCount: user.warningCount,
      status: user.status,
      createdAt: dayjs(user['createdAt']).format('YYYY-MM-DD'),
    };
  }

  static getSheetValue(): ExcelSheetValue<UsersHaveStoreDownloadExcelDTO> {
    return {
      id: { name: 'ID', width: 30 },
      avatar: { name: 'Ảnh đại diện', width: 50 },
      fullName: { name: 'Họ và tên', width: 25 },
      email: { name: 'Email', width: 25 },
      address: { name: 'Địa chỉ', width: 50 },
      phone: { name: 'Số điện thoại', width: 25 },
      gender: { name: 'Giới tính', width: 25 },
      birthday: { name: 'Ngày sinh', width: 25 },
      role: { name: 'Role', width: 25 },
      wallet: { name: 'Số xu', width: 25 },
      warningCount: { name: 'Số lần bị cảnh báo', width: 25 },
      status: { name: 'Trạng thái hoạt động', width: 25 },
      createdAt: { name: 'Ngày đăng ký', width: 25 },
      storeId: { name: 'ID cửa hàng', width: 30 },
      storeName: { name: 'Tên cửa hàng', width: 25 },
      storeAvatar: { name: 'Ảnh cửa hàng', width: 50 },
      joinDate: { name: 'Ngày tham gia', width: 25 },
    };
  }
}
