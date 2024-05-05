import * as dayjs from 'dayjs';
import { ExcelSheetValue } from 'shared/helpers/type.helper';

export class StoreBeingReportedDownloadExcelDTO {
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
  userReportName: string;
  content: string;

  static fromEntity(report: any): StoreBeingReportedDownloadExcelDTO {
    return {
      id: report.store._id.toString(),
      userId: report.store.userId.toString(),
      userName: report.userName,
      avatar: report.store.avatar,
      name: report.store.name,
      address: report.store.address,
      phoneNumber: report.store.phoneNumber.map((phone, index) => `Số điện thoại ${index + 1}: ${phone}`).join('\n'),
      description: report.store.description,
      warningCount: report.store.warningCount,
      status: report.store.status,
      createdAt: dayjs(report.store['createdAt']).format('YYYY-MM-DD'),
      userReportName: report.userReportName,
      content: report.content,
    };
  }

  static getSheetValue(): ExcelSheetValue<StoreBeingReportedDownloadExcelDTO> {
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
      userReportName: { name: 'Người báo cáo', width: 30 },
      content: { name: 'Nội dung báo cáo', width: 50 },
    };
  }
}
