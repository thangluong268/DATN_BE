import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import sortByConditions from 'shared/helpers/sort-by-condition.helper';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { CategoryService } from '../category/category.service';
import { StoreService } from '../store/store.service';
import { ProductCreateREQ } from './request/product-create.request';
import { GetProductsREQ } from './request/product-get-public.request';
import { Product } from './schema/product.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,

    private readonly storeService: StoreService,
    private readonly categoryService: CategoryService,
  ) {}

  async create(userId: string, body: ProductCreateREQ) {
    const store = await this.storeService.findByUserId(userId);
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const category = await this.categoryService.findById(body.categoryId);
    if (!category) throw new NotFoundException('Không tìm thấy danh mục này!');
    const newProduct = await this.productModel.create({ ...body, storeId: store._id });
    return BaseResponse.withMessage<Product>(toDocModel(newProduct), 'Tạo sản phẩm thành công!');
  }

  async getProductGives(query: PaginationREQ) {
    const condition = { newPrice: 0, status: true };
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.productModel.countDocuments(condition);
    const products = await this.productModel.find(condition, {}, { lean: true }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const sortTypeQuery = 'desc';
    const sortValueQuery = 'productName';
    sortByConditions(products, sortTypeQuery, sortValueQuery);
    return PaginationResponse.ofWithTotalAndMessage(products, total, 'Lấy sản phẩm thành công!');
  }

  async getProducts(query: GetProductsREQ, status: any) {
    const condition = GetProductsREQ.toQueryCondition(query, status);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.productModel.countDocuments(condition);
    const products = await this.productModel.find(condition, {}, { lean: true }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const { sortTypeQuery, sortValueQuery } = GetProductsREQ.toSortCondition(query);
    sortByConditions(products, sortTypeQuery, sortValueQuery);
    return PaginationResponse.ofWithTotalAndMessage(products, total, 'Lấy sản phẩm thành công!');
  }

  async findById(id: string) {
    return await this.productModel.findById(id, {}, { lean: true });
  }

  async checkExceedQuantityInStock(id: string, quantity: number) {
    const product = await this.findById(id);
    if (quantity > product.quantity) {
      throw new NotFoundException('Số lượng sản phẩm trong kho không đủ!');
    }
  }

  async decreaseQuantity(id: string, quantitySold: number) {
    const product = await this.productModel.findById(id);
    product.quantity -= quantitySold;
    if (product.quantity === 0) {
      product.status = false;
    }
    await product.save();
  }

  async countTotal() {
    return await this.productModel.countDocuments();
  }
}
