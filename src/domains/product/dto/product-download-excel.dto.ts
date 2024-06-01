import * as dayjs from 'dayjs';
import { ExcelSheetValue } from 'shared/helpers/type.helper';

export class ProductsDownloadExcelDTO {
  id: string;
  name: string;
  quantity: number;
  quantitySold: number;
  quantityGive: number;
  oldPrice: number;
  newPrice: number;
  category: string;
  storeName: string;
  status: string;
  createdAt: string;

  static fromEntity(product: any): ProductsDownloadExcelDTO {
    const status = product.status ? 'Đang hoạt động' : 'Ngừng hoạt động';
    return {
      id: product._id.toString(),
      name: product.name,
      quantity: product.quantity,
      quantitySold: product.quantitySold,
      quantityGive: product.quantityGive,
      oldPrice: product.oldPrice,
      newPrice: product.newPrice,
      category: product.categoryName,
      storeName: product.storeName,
      status,
      createdAt: dayjs(product['createdAt']).format('YYYY-MM-DD'),
    };
  }

  static getSheetValue(): ExcelSheetValue<ProductsDownloadExcelDTO> {
    return {
      id: { name: 'ID', width: 30 },
      name: { name: 'Tên sản phẩm', width: 40 },
      quantity: { name: 'Số lượng trong kho', width: 20 },
      quantitySold: { name: 'Số lượng đã bán', width: 20 },
      quantityGive: { name: 'Số lượng đã tặng', width: 20 },
      oldPrice: { name: 'Giá cũ', width: 25 },
      newPrice: { name: 'Giá mới', width: 25 },
      category: { name: 'Loại sản phẩm', width: 30 },
      storeName: { name: 'Tên cửa hàng', width: 30 },
      status: { name: 'Trạng thái hoạt động', width: 25 },
      createdAt: { name: 'Ngày tạo', width: 25 },
    };
  }
}
