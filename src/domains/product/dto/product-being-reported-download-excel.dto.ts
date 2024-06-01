import * as dayjs from 'dayjs';
import { ExcelSheetValue } from 'shared/helpers/type.helper';

export class ProductsBeingReportedDownloadExcelDTO {
  id: string;
  userName: string;
  productName: string;
  content: string;
  createdAt: string;

  static fromEntity(report: any): ProductsBeingReportedDownloadExcelDTO {
    return {
      id: report._id.toString(),
      userName: report.userName,
      productName: report.productName,
      content: report.content,
      createdAt: dayjs(report.createdAt).format('YYYY-MM-DD'),
    };
  }

  static getSheetValue(): ExcelSheetValue<ProductsBeingReportedDownloadExcelDTO> {
    return {
      id: { name: 'ID', width: 30 },
      userName: { name: 'Người báo cáo', width: 30 },
      productName: { name: 'Sản phẩm bị báo cáo', width: 40 },
      content: { name: 'Nội dung báo cáo', width: 50 },
      createdAt: { name: 'Ngày tạo', width: 25 },
    };
  }
}
