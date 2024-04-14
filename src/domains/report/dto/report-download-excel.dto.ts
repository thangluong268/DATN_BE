import * as dayjs from 'dayjs';
import { ExcelSheetValue } from 'shared/helpers/type.helper';

export class ReportDownloadExcelDTO {
  id: string;
  subjectId: string;
  subjectName: string;
  userId: string;
  userName: string;
  content: string;
  type: string;
  status: string;
  createdAt: string;

  static fromEntity(report: any): ReportDownloadExcelDTO {
    return {
      id: report._id.toString(),
      subjectId: report.subjectId.toString(),
      subjectName: report['subjectName'],
      userId: report.userId.toString(),
      userName: report.userName,
      content: report.content,
      type: report.type,
      status: report.status,
      createdAt: dayjs(report['createdAt']).format('YYYY-MM-DD'),
    };
  }

  static getSheetValue(): ExcelSheetValue<ReportDownloadExcelDTO> {
    return {
      id: { name: 'ID', width: 30 },
      userId: { name: 'ID người tạo', width: 30 },
      userName: { name: 'Tên người tạo', width: 50 },
      subjectId: { name: 'ID đối tượng', width: 30 },
      subjectName: { name: 'Tên đối tượng', width: 30 },
      content: { name: 'Nội dung', width: 50 },
      type: { name: 'Mục báo cáo', width: 25 },
      status: { name: 'Đã được kiểm duyệt', width: 25 },
      createdAt: { name: 'Ngày tạo', width: 25 },
    };
  }
}
