import * as dayjs from 'dayjs';
import { SOCIAL_APP } from 'shared/constants/user.constant';
import { ExcelSheetValue } from 'shared/helpers/type.helper';
import { User } from '../schema/user.schema';

export class UserDownloadExcelDTO {
  id: string;
  avatar: string;
  fullName: string;
  email: string;
  address: string;
  phone: string;
  gender: string;
  birthday: string;
  role: string;
  wallet: number;
  warningCount: number;
  status: boolean;
  socialId: string;
  socialApp: SOCIAL_APP;
  createdAt: string;

  static fromEntity(user: User): UserDownloadExcelDTO {
    return {
      id: user._id.toString(),
      avatar: user.avatar,
      fullName: user.fullName,
      email: user.email,
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
      socialId: user.socialId,
      socialApp: user.socialApp,
      createdAt: dayjs(user['createdAt']).format('YYYY-MM-DD'),
    };
  }

  static getSheetValue(): ExcelSheetValue<UserDownloadExcelDTO> {
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
      socialId: { name: 'Social ID', width: 25 },
      socialApp: { name: 'Social APP', width: 25 },
      createdAt: { name: 'Ngày đăng ký', width: 25 },
    };
  }
}
