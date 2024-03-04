import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BillService } from 'domains/bill/bill.service';
import { Model } from 'mongoose';
import { PRODUCT_TYPE } from 'shared/enums/bill.enum';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import sortByConditions from 'shared/helpers/sort-by-condition.helper';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { CategoryService } from '../category/category.service';
import { StoreService } from '../store/store.service';
import { ProductCreateREQ } from './request/product-create.request';
import { ProductGetInStoreREQ } from './request/product-get-in-store.request';
import { ProductGetMostInStoreREQ } from './request/product-get-most-in-store.request';
import { ProductGetOtherInStoreREQ } from './request/product-get-orther-in-store.request';
import { ProductsGetREQ } from './request/product-get.request';
import { ProductUpdateREQ } from './request/product-update.request';
import { Product } from './schema/product.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,

    private readonly storeService: StoreService,
    private readonly categoryService: CategoryService,
    private readonly billService: BillService,
  ) {}

  async create(userId: string, body: ProductCreateREQ) {
    const store = await this.storeService.findByUserId(userId);
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const category = await this.categoryService.findById(body.categoryId);
    if (!category) throw new NotFoundException('Không tìm thấy danh mục này!');
    const newProduct = await this.productModel.create({ ...body, storeId: store._id });
    return BaseResponse.withMessage<Product>(toDocModel(newProduct), 'Tạo sản phẩm thành công!');
  }

  async getProductsGive(query: PaginationREQ) {
    const condition = { newPrice: 0, status: true };
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.productModel.countDocuments(condition);
    const products = await this.productModel.find(condition, {}, { lean: true }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const sortTypeQuery = 'desc';
    const sortValueQuery = 'productName';
    sortByConditions(products, sortTypeQuery, sortValueQuery);
    return PaginationResponse.ofWithTotalAndMessage(products, total, 'Lấy sản phẩm thành công!');
  }

  async getProducts(query: ProductsGetREQ) {
    const condition = ProductsGetREQ.toQueryCondition(null, query, { status: true });
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.productModel.countDocuments(condition);
    const products = await this.productModel.find(condition, {}, { lean: true }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const { sortTypeQuery, sortValueQuery } = ProductsGetREQ.toSortCondition(query);
    sortByConditions(products, sortTypeQuery, sortValueQuery);
    return PaginationResponse.ofWithTotalAndMessage(products, total, 'Lấy sản phẩm thành công!');
  }

  async getProductsBySeller(userId: string, query: ProductsGetREQ) {
    const store = await this.storeService.findByUserId(userId);
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const condition = ProductsGetREQ.toQueryCondition(store._id, query, {});
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.productModel.countDocuments(condition);
    const products = await this.productModel.find(condition, {}, { lean: true }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const { sortTypeQuery, sortValueQuery } = ProductsGetREQ.toSortCondition(query);
    sortByConditions(products, sortTypeQuery, sortValueQuery);
    const productsFullInfo = await Promise.all(
      products.map(async (product) => {
        const category = await this.categoryService.findOne(product.categoryId);
        const quantitySold = await this.billService.countProductDelivered(product._id, PRODUCT_TYPE.SELL, 'DELIVERED');
        const quantityGive = await this.billService.countProductDelivered(product._id, PRODUCT_TYPE.GIVE, 'DELIVERED');
        const revenue = quantitySold * product.newPrice;
        const isPurchased = await this.billService.checkProductPurchased(product._id);
        return {
          ...product,
          categoryName: category.name,
          storeName: store.name,
          quantitySold,
          quantityGive,
          revenue,
          isPurchased,
        };
      }),
    );
    return PaginationResponse.ofWithTotalAndMessage(productsFullInfo, total, 'Lấy sản phẩm thành công!');
  }

  async getProductsByManager(query: ProductsGetREQ) {
    const condition = ProductsGetREQ.toQueryCondition(null, query, {});
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.productModel.countDocuments(condition);
    const products = await this.productModel.find(condition, {}, { lean: true }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const { sortTypeQuery, sortValueQuery } = ProductsGetREQ.toSortCondition(query);
    sortByConditions(products, sortTypeQuery, sortValueQuery);

    const productsFullInfo = await Promise.all(
      products.map(async (product) => {
        const category = await this.categoryService.findOne(product.categoryId);
        const store = await this.storeService.findById(product.storeId);
        const quantitySold = await this.billService.countProductDelivered(product._id, PRODUCT_TYPE.SELL, 'DELIVERED');
        const quantityGive = await this.billService.countProductDelivered(product._id, PRODUCT_TYPE.GIVE, 'DELIVERED');
        const revenue = quantitySold * product.newPrice;
        return {
          ...product,
          categoryName: category.name,
          storeName: store.name,
          quantitySold,
          quantityGive,
          revenue,
        };
      }),
    );
    return PaginationResponse.ofWithTotalAndMessage(productsFullInfo, total, 'Lấy danh sách sản phẩm thành công!');
  }

  async getProductsInStore(query: ProductGetInStoreREQ) {
    const store = await this.storeService.findById(query.storeId);
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const condition = ProductsGetREQ.toQueryCondition(query.storeId, query, { status: true });
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.productModel.countDocuments(condition);
    const products = await this.productModel.find(condition, {}, { lean: true }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const { sortTypeQuery, sortValueQuery } = ProductsGetREQ.toSortCondition(query);
    sortByConditions(products, sortTypeQuery, sortValueQuery);
    const productsFullInfo = await Promise.all(
      products.map(async (product) => {
        const category = await this.categoryService.findOne(product.categoryId);
        return {
          ...product,
          categoryName: category.name,
          storeName: store.name,
        };
      }),
    );
    return PaginationResponse.ofWithTotalAndMessage(productsFullInfo, total, 'Lấy danh sách sản phẩm của cửa hàng thành công!');
  }

  async getProductsOtherInStore(query: ProductGetOtherInStoreREQ) {
    const { storeId, productId } = query;
    const products = await this.productModel
      .find({ _id: { $ne: productId }, storeId, status: true }, {}, { lean: true })
      .sort({ createdAt: -1 })
      .limit(12);
    return BaseResponse.withMessage(products, 'Lấy danh sách sản phẩm khác thành công!');
  }

  async getProductsLasted(limit: number = 10) {
    const products = await this.productModel.find({ status: true }, {}, { lean: true }).sort({ createdAt: -1 }).limit(limit);
    return BaseResponse.withMessage(products, 'Lấy danh sách sản phẩm mới nhất thành công!');
  }

  async getProductsMostInStore(limit: number = 10) {
    const stores = await this.productModel.aggregate(ProductGetMostInStoreREQ.toQueryCondition(limit) as any);
    const data = await Promise.all(
      stores.map(async (item) => {
        const store = await this.storeService.findById(item._id);
        if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
        const products = await this.productModel
          .find({ storeId: store._id, status: true }, { storeId: 0, status: 0, createdAt: 0, updatedAt: 0 }, { lean: true })
          .limit(10);
        return {
          storeId: store._id,
          storeName: store.name,
          storeAvatar: store.avatar,
          listProducts: products,
        };
      }),
    );
    return BaseResponse.withMessage(data, 'Lấy danh sách sản phẩm bán chạy nhất thành công!');
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

  async update(id: string, body: ProductUpdateREQ) {
    await this.productModel.findByIdAndUpdate(id, { ...body });
    return BaseResponse.withMessage({}, 'Cập nhật sản phẩm thành công!');
  }
}
