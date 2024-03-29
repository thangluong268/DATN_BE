import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BillService } from 'domains/bill/bill.service';
import { Bill } from 'domains/bill/schema/bill.schema';
import { EvaluationService } from 'domains/evaluation/evaluation.service';
import { Evaluation } from 'domains/evaluation/schema/evaluation.schema';
import { Feedback } from 'domains/feedback/schema/feedback.schema';
import { Store } from 'domains/store/schema/store.schema';
import { ObjectId } from 'mongodb';
import { Model, Types } from 'mongoose';
import { PRODUCT_TYPE } from 'shared/enums/bill.enum';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import sortByConditions from 'shared/helpers/sort-by-condition.helper';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { CategoryService } from '../category/category.service';
import { StoreService } from '../store/store.service';
import { ProductCreateREQ } from './request/product-create.request';
import { ProductGetFilterREQ } from './request/product-get-filter.request';
import { ProductGetInStoreREQ } from './request/product-get-in-store.request';
import { ProductsGetLoveREQ } from './request/product-get-love.request';
import { ProductGetMostInStoreREQ } from './request/product-get-most-in-store.request';
import { ProductGetOtherInStoreREQ } from './request/product-get-orther-in-store.request';
import { ProductGetRandomREQ } from './request/product-get-random.request';
import { ProductsGetREQ } from './request/product-get.request';
import { ProductUpdateREQ } from './request/product-update.request';
import { Product } from './schema/product.schema';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,

    @InjectModel(Evaluation.name)
    private readonly evaluationModel: Model<Evaluation>,
    @Inject(forwardRef(() => EvaluationService))
    private readonly evaluationService: EvaluationService,

    @InjectModel(Bill.name)
    private readonly billModel: Model<Bill>,
    @Inject(forwardRef(() => BillService))
    private readonly billService: BillService,

    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<Feedback>,

    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,
    private readonly storeService: StoreService,

    private readonly categoryService: CategoryService,
  ) {}

  async create(userId: string, body: ProductCreateREQ) {
    this.logger.log(`Create Product: ${userId}`);
    const store = await this.storeService.findByUserId(userId);
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const category = await this.categoryService.findById(body.categoryId);
    if (!category) throw new NotFoundException('Không tìm thấy danh mục này!');
    const newProduct = await this.productModel.create({ ...body, storeId: store._id });
    await this.evaluationService.create(newProduct._id);
    return BaseResponse.withMessage<Product>(toDocModel(newProduct), 'Tạo sản phẩm thành công!');
  }

  async getProductsGive(query: PaginationREQ) {
    this.logger.log(`Get Products Give: ${JSON.stringify(query)}`);
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
    this.logger.log(`Get Products: ${JSON.stringify(query)}`);
    const condition = ProductsGetREQ.toQueryCondition(null, query, { status: true });
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.productModel.countDocuments(condition);
    const products = await this.productModel.find(condition, {}, { lean: true }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const { sortTypeQuery, sortValueQuery } = ProductsGetREQ.toSortCondition(query);
    sortByConditions(products, sortTypeQuery, sortValueQuery);
    return PaginationResponse.ofWithTotalAndMessage(products, total, 'Lấy sản phẩm thành công!');
  }

  async getProductsBySeller(userId: string, query: ProductsGetREQ) {
    this.logger.log(`Get Products By Seller: ${userId}`);
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
    return { message: 'Lấy sản phẩm thành công!', metadata: { products: productsFullInfo, total } };
  }

  async getProductsByManager(query: ProductsGetREQ) {
    this.logger.log(`Get Products By Manager: ${JSON.stringify(query)}`);
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
    this.logger.log(`Get Products In Store: ${JSON.stringify(query)}`);
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
    this.logger.log(`Get Products Other In Store: ${JSON.stringify(query)}`);
    const { storeId, productId } = query;
    const products = await this.productModel
      .find({ _id: { $ne: productId }, storeId, status: true }, {}, { lean: true })
      .sort({ createdAt: -1 })
      .limit(12);
    return BaseResponse.withMessage(products, 'Lấy danh sách sản phẩm khác thành công!');
  }

  async getProductsLasted(limitQuery: number) {
    this.logger.log(`Get Products Lasted: ${limitQuery || 10}`);
    const limit = limitQuery || 10;
    const products = await this.productModel.aggregate([
      { $match: { status: true } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      { $addFields: { storeIdObj: { $toObjectId: '$storeId' } } },
      {
        $lookup: {
          from: 'stores',
          localField: 'storeIdObj',
          foreignField: '_id',
          as: 'store',
        },
      },
      { $unwind: '$store' },
      { $addFields: { storeName: '$store.name' } },
      { $project: { store: 0, storeIdObj: 0 } },
    ]);
    return BaseResponse.withMessage(products, 'Lấy danh sách sản phẩm mới nhất thành công!');
  }

  async getProductsMostInStore(limitQuey: number) {
    this.logger.log(`Get Products Most In Store: ${limitQuey || 10}`);
    const limit = limitQuey || 10;
    const stores = await this.productModel.aggregate(ProductGetMostInStoreREQ.toQueryCondition(limit) as any);
    const data = await Promise.all(
      stores.map(async (item) => {
        const storeId = new ObjectId(item._id);
        return (
          await this.storeModel.aggregate([
            { $match: { _id: storeId } },
            { $addFields: { idString: { $toString: '$_id' } } },
            {
              $lookup: {
                from: 'products',
                localField: 'idString',
                foreignField: 'storeId',
                as: 'products',
              },
            },
            {
              $addFields: {
                listProducts: {
                  $map: {
                    input: { $slice: ['$products', 10] },
                    as: 'product',
                    in: {
                      _id: '$$product._id',
                      avatar: '$$product.avatar',
                      quantity: '$$product.quantity',
                      name: '$$product.name',
                      oldPrice: '$$product.oldPrice',
                      newPrice: '$$product.newPrice',
                      description: '$$product.description',
                      categoryId: '$$product.categoryId',
                      keywords: '$$product.keywords',
                      storeId: '$$product.storeId',
                      storeName: '$name',
                    },
                  },
                },
              },
            },
            { $addFields: { storeId: { $toString: '$_id' } } },
            { $addFields: { storeName: '$name' } },
            { $addFields: { storeAvatar: '$avatar' } },
            { $project: { _id: 0, storeId: 1, storeName: 1, storeAvatar: 1, listProducts: 1 } },
          ])
        )[0];
      }),
    );
    return BaseResponse.withMessage(data, 'Lấy danh sách sản phẩm bán chạy nhất thành công!');
  }

  async getProductsRandom(query: ProductGetRandomREQ, body: string[]) {
    this.logger.log(`Get Products Random: ${JSON.stringify(query)}`);
    const limit = query.limit || 10;
    const excludeIds = body.map((id) => new Types.ObjectId(id));
    const products = await this.productModel.aggregate(ProductGetRandomREQ.toQueryCondition(query, excludeIds));
    const remainingLimit = limit - products.length;
    if (remainingLimit < limit) {
      const currentExcludeIds = products.map((product) => product._id);
      excludeIds.push(...currentExcludeIds);
      const otherProducts = await this.productModel.aggregate(
        ProductGetRandomREQ.toQueryConditionRemain(remainingLimit, excludeIds),
      );
      products.push(...otherProducts);
    }
    const nextCursor = products.length > 0 ? products[products.length - 1]['createdAt'] : null;
    return BaseResponse.withMessage({ products, nextCursor }, 'Lấy danh sách sản phẩm ngẫu nhiên thành công!');
  }

  async getProductsFilter(query: ProductGetFilterREQ) {
    this.logger.log(`Get Products Filter: ${JSON.stringify(query)}`);
    const category = await this.categoryService.findOne(query.search);
    const condition = ProductGetFilterREQ.toQueryCondition(query);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.productModel.countDocuments(condition);
    const products = await this.productModel
      .find(condition, {}, { lean: true })
      .sort({ price: 1, quantity: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return BaseResponse.withMessage(
      {
        total,
        products,
        categoryName: category.name,
      },
      'Lấy danh sách sản phẩm theo điều kiện thành công!',
    );
  }

  async getProductsLoveByUser(userId: string, query: ProductsGetLoveREQ) {
    this.logger.log(`Get Products Love By User: ${userId}`);
    const conditionFindProduct = ProductsGetLoveREQ.toQueryConditionFindProduct(query);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const productIds = (await this.productModel.find(conditionFindProduct).select('_id').lean()).map((product) => product._id);
    const conditionFindEvaluation = ProductsGetLoveREQ.toQueryConditionFindEvaluation(userId, productIds);
    const total = await this.evaluationModel.countDocuments(conditionFindEvaluation);
    const productIdsOfEvaluations = (
      await this.evaluationModel
        .find(conditionFindEvaluation)
        .sort({ updatedAt: -1 })
        .limit(limit)
        .skip(skip)
        .select('productId')
        .lean()
    ).map((evaluation) => evaluation.productId);
    const products = await Promise.all(
      productIdsOfEvaluations.map(async (productId) => {
        return await this.productModel.findById(productId, {}, { lean: true });
      }),
    );
    const data = await Promise.all(
      products.map(async (product) => {
        const quantitySold = await this.billService.countProductDelivered(product._id, PRODUCT_TYPE.SELL, 'DELIVERED');
        const quantityGive = await this.billService.countProductDelivered(product._id, PRODUCT_TYPE.GIVE, 'DELIVERED');
        const revenue = quantitySold * product.newPrice;
        const category = await this.categoryService.findOne(product.categoryId);
        const store = await this.storeService.findById(product.storeId);
        return { ...product, categoryName: category.name, storeName: store.name, quantitySold, quantityGive, revenue };
      }),
    );
    return PaginationResponse.ofWithTotalAndMessage(data, total, 'Lấy danh sách sản phẩm yêu thích thành công!');
  }

  async getProductsWithDetailByManager() {
    this.logger.log(`Get Products With Detail By Manager`);
    const products = await this.productModel.find().lean().limit(30);
    const data = await Promise.all(
      products.map(async (item) => {
        const product = await this.productModel.findById(item._id, {}, { lean: true });
        if (!product) return;
        const evaluation = await this.evaluationModel.findOne({ productId: item._id }).lean();
        if (!evaluation) return;
        const total = evaluation.emojis.length;
        const emoji = { Haha: 0, Love: 0, Wow: 0, Sad: 0, Angry: 0, like: 0 };
        evaluation.emojis.forEach((e) => {
          switch (e.name) {
            case 'Haha':
              emoji.Haha++;
              break;
            case 'Love':
              emoji.Love++;
              break;
            case 'Wow':
              emoji.Wow++;
              break;
            case 'Sad':
              emoji.Sad++;
              break;
            case 'Angry':
              emoji.Angry++;
              break;
            case 'like':
              emoji.like++;
              break;
          }
        });
        const emojis = {
          total,
          haha: emoji.Haha,
          love: emoji.Love,
          wow: emoji.Wow,
          sad: emoji.Sad,
          angry: emoji.Angry,
          like: emoji.like,
        };
        const feedbacks = await this.feedbackModel.find({ productId: item._id }).sort({ createdAt: -1 }).lean();
        const star = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        const starPercent = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let averageStar = 0;
        if (feedbacks.length > 0) {
          feedbacks.forEach((feedback) => {
            star[feedback.star]++;
          });
          Object.keys(star).forEach((key) => {
            starPercent[key] = Math.round((star[key] / feedbacks.length) * 100);
          });
          Object.keys(star).forEach((key) => {
            averageStar += star[key] * Number(key);
          });
          averageStar = Number((averageStar / feedbacks.length).toFixed(2));
        }
        const totalFeedback = await this.feedbackModel.countDocuments({ productId: item._id });
        const store = await this.storeService.findById(item.storeId);
        if (!store) return;
        const category = await this.categoryService.findOne(product.categoryId);
        const quantitySold = await this.billService.countProductDelivered(item._id, PRODUCT_TYPE.SELL, 'DELIVERED');
        const quantityGive = await this.billService.countProductDelivered(item._id, PRODUCT_TYPE.GIVE, 'DELIVERED');
        const revenue = quantitySold * product.newPrice;
        const isPurchased = await this.billService.checkProductPurchased(item._id);
        const productFullInfo = {
          ...product,
          categoryName: category.name,
          storeName: store.name,
          quantitySold,
          quantityGive,
          revenue,
          isPurchased,
        };
        return { product: productFullInfo, emojis, starPercent, averageStar, totalFeedback };
      }),
    );
    return BaseResponse.withMessage(data, 'Lấy danh sách sản phẩm thành công!');
  }

  async getProductById(id: string) {
    this.logger.log(`Get Product By Id: ${id}`);
    const product = await this.productModel.findById(id).lean();
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm này!');
    const type = product.newPrice === 0 ? PRODUCT_TYPE.GIVE : PRODUCT_TYPE.SELL;
    const quantityDelivered = await this.billService.countProductDelivered(id, type, 'DELIVERED');
    const category = await this.categoryService.findOne(product.categoryId);
    const store = await this.storeService.findById(product.storeId);
    const data = { ...product };
    return BaseResponse.withMessage(
      { data, quantityDelivered, categoryName: category.name, storeName: store.name },
      'Lấy thông tin sản phẩm thành công!',
    );
  }

  async getProductByManager(id: string) {
    this.logger.log(`Get Product By Manager: ${id}`);
    const product = await this.productModel.findById(id).lean();
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm này!');
    const type = product.newPrice === 0 ? PRODUCT_TYPE.GIVE : PRODUCT_TYPE.SELL;
    const quantityDelivered = await this.billService.countProductDelivered(id, type, 'DELIVERED');
    const evaluation = await this.evaluationModel.findOne({ productId: id }).lean();
    if (!evaluation) throw new NotFoundException('Không tìm thấy đánh giá của sản phẩm này!');
    const total = evaluation.emojis.length;
    const emoji = { Haha: 0, Love: 0, Wow: 0, Sad: 0, Angry: 0, like: 0 };
    evaluation.emojis.forEach((e) => {
      switch (e.name) {
        case 'Haha':
          emoji.Haha++;
          break;
        case 'Love':
          emoji.Love++;
          break;
        case 'Wow':
          emoji.Wow++;
          break;
        case 'Sad':
          emoji.Sad++;
          break;
        case 'Angry':
          emoji.Angry++;
          break;
        case 'like':
          emoji.like++;
          break;
      }
    });
    const emojis = {
      total,
      haha: emoji.Haha,
      love: emoji.Love,
      wow: emoji.Wow,
      sad: emoji.Sad,
      angry: emoji.Angry,
      like: emoji.like,
    };
    const feedbacks = await this.feedbackModel.find({ productId: id }).sort({ createdAt: -1 }).lean();
    const star = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const starPercent = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let averageStar = 0;
    feedbacks.forEach((feedback) => {
      star[feedback.star]++;
    });
    Object.keys(star).forEach((key) => {
      starPercent[key] = Math.round((star[key] / feedbacks.length) * 100);
    });
    Object.keys(star).forEach((key) => {
      averageStar += star[key] * Number(key);
    });
    averageStar = Number((averageStar / feedbacks.length).toFixed(2));
    const totalFeedback = await this.feedbackModel.countDocuments({ productId: id });
    return BaseResponse.withMessage(
      { product, quantityDelivered, emojis, starPercent, averageStar, totalFeedback },
      'Lấy thông tin sản phẩm bởi Manager thành công!',
    );
  }

  async findById(id: string) {
    return await this.productModel.findById(id, {}, { lean: true });
  }

  async checkExceedQuantityInStock(id: string, quantity: number) {
    const product = await this.findById(id);
    if (quantity > product.quantity) {
      throw new NotFoundException(`Số lượng sản phẩm trong kho không đủ! Còn lại: ${product.quantity}`);
    }
  }

  async decreaseQuantity(id: string, quantitySold: number) {
    const product = await this.productModel.findById(id);
    product.quantity -= quantitySold;
    await product.save();
  }

  async countTotal() {
    return await this.productModel.countDocuments();
  }

  async update(id: string, body: ProductUpdateREQ) {
    this.logger.log(`Update Product: ${id}`);
    await this.productModel.findByIdAndUpdate(id, { ...body });
    return BaseResponse.withMessage({}, 'Cập nhật sản phẩm thành công!');
  }

  async delete(userId: string, userRole: string[], id: string) {
    this.logger.log(`Delete Product: ${id}`);
    const product = await this.productModel.findOne({ _id: id, status: true }).lean();
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm này!');
    const isPurchased = await this.billModel.findOne({ 'products.id': id }).lean();
    if (isPurchased) throw new BadRequestException('Sản phẩm này đã được mua, không thể xóa!');
    if (!(userRole.includes(ROLE_NAME.MANAGER) || userRole.includes(ROLE_NAME.ADMIN))) {
      const store = await this.storeService.findByUserId(userId);
      if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
      if (product.storeId.toString() !== store._id.toString())
        throw new ForbiddenException('Bạn không có quyền xóa sản phẩm này!');
    }
    await this.productModel.findByIdAndUpdate(id, { status: false });
    return BaseResponse.withMessage({}, 'Xóa sản phẩm thành công!');
  }
}
