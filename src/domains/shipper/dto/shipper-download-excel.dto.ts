import * as dayjs from 'dayjs';
import { User } from 'domains/user/schema/user.schema';
import { ExcelSheetValue } from 'shared/helpers/type.helper';

export class ShipperDownloadExcelDTO {
  id: string;
  avatar: string;
  fullName: string;
  email: string;
  emailShipper: string;
  address: string;
  phone: string;
  gender: string;
  role: string;
  status: boolean;
  createdAt: string;

  static fromEntity(shipper: User): ShipperDownloadExcelDTO {
    return {
      id: shipper._id.toString(),
      avatar: shipper.avatar,
      fullName: shipper.fullName,
      email: shipper.email,
      emailShipper: shipper.emailShipper,
      address: shipper.addressShipper,
      phone: shipper.phone,
      gender: shipper.gender,
      role: shipper.role.map((role) => role).join('\n'),
      status: shipper.status,
      createdAt: dayjs(shipper['createdAt']).format('YYYY-MM-DD'),
    };
  }

  static getSheetValue(): ExcelSheetValue<ShipperDownloadExcelDTO> {
    return {
      id: { name: 'ID', width: 30 },
      avatar: { name: 'Ảnh đại diện', width: 50 },
      fullName: { name: 'Họ và tên', width: 25 },
      email: { name: 'Tài khoản đăng nhập', width: 25 },
      emailShipper: { name: 'Email cá nhân', width: 25 },
      address: { name: 'Địa chỉ', width: 50 },
      phone: { name: 'Số điện thoại', width: 25 },
      gender: { name: 'Giới tính', width: 25 },
      role: { name: 'Role', width: 25 },
      status: { name: 'Trạng thái hoạt động', width: 25 },
      createdAt: { name: 'Ngày đăng ký', width: 25 },
    };
  }
}
