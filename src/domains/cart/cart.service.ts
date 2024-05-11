import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ProductInfoDTO } from 'domains/bill/dto/product-info.dto';
import { ProductDTO } from 'domains/product/dto/product.dto';
import { Product } from 'domains/product/schema/product.schema';
import { Store } from 'domains/store/schema/store.schema';
import { Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { CartGetPagingByUserREQ } from './request/cart-get-paging-by-user.request';
import { Cart } from './schema/cart.schema';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<Cart>,

    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,

    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,
  ) {}

  async handleAddProductIntoCart(userId: string, productId: string) {
    this.logger.log(`Handle Add Product Into Cart: ${userId} - ${productId}`);
    const product = await this.productModel.findById(productId).lean();
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm này!');
    }
    const store = await this.storeModel.findById(product.storeId).lean();
    if (!store) {
      throw new NotFoundException('Không tìm thấy cửa hàng này!');
    }

    let result;

    // 1. Get all carts of user
    // Deep 0
    const carts = await this.cartModel.find({ userId }, {});

    if (!carts) {
      // 2. If user has no cart -> create new cart
      result = await this.create(userId, store, product);
    } else {
      // 3. If user has at least 1 cart -> check cart of store with storeId of product
      // Deep 1
      const cartOfStore = carts.find((cart) => cart.storeId.toString() === store._id.toString());
      if (!cartOfStore) {
        // 4. If user has a cart but not have cart of store -> add product to cart
        result = await this.create(userId, store, product);
      } else {
        // 5. If user has a cart of store -> check product has existed in cart
        // Deep 2
        const productInCart = cartOfStore.products.find((product) => product.id.toString() === productId.toString());
        if (!productInCart) {
          // 6. If product not existed in cart -> add product to cart
          result = await this.addNewProductIntoCartOfStore(cartOfStore, ProductDTO.toNewCart(product));
        } else {
          // 7. If product existed in cart -> increase quantity of product
          result = await this.increaseProductQuantity(cartOfStore, productId, product.quantity);
        }
      }
    }

    return BaseResponse.withMessage<Cart>(result, 'Thêm sản phẩm vào giỏ hàng thành công!');
  }

  async create(userId: string, store: Store, product: Product) {
    this.logger.log(`Create Cart: ${userId} - ${store._id} - ${product._id}`);
    const productIntoCart = ProductDTO.toNewCart(product);
    const newCart = await this.cartModel.create({
      userId,
      storeId: store._id,
      storeAvatar: store.avatar,
      storeName: store.name,
      products: [productIntoCart],
    });
    newCart.totalPrice = this.getTotalPrice(newCart.products);
    await newCart.save();
    return toDocModel(newCart);
  }

  async addNewProductIntoCartOfStore(cart: Cart, product: ProductDTO) {
    this.logger.log(`Add New Product Into Cart Of Store: ${cart._id} - ${product.id}`);
    cart.products.push(product);
    cart.totalPrice = this.getTotalPrice(cart.products);
    return await this.cartModel.findByIdAndUpdate(cart._id, cart, { lean: true, new: true });
  }

  async increaseProductQuantity(cart: Cart, productId: string, quantityInStock: number) {
    const product = cart.products.find((product) => product.id.toString() === productId.toString());
    product.quantity += 1;
    product.quantityInStock = quantityInStock;
    const productToCheck = await this.productModel.findById(product.id).lean();
    if (product.quantity > productToCheck.quantity) {
      throw new BadRequestException(`Số lượng sản phẩm trong kho không đủ! Còn lại: ${productToCheck.quantity}`);
    }
    cart.totalPrice = this.getTotalPrice(cart.products);
    return await this.cartModel.findByIdAndUpdate(cart._id, cart, { lean: true, new: true });
  }

  private getTotalPrice(products: ProductDTO[]) {
    return products.reduce((total, product) => {
      return total + product.newPrice * product.quantity;
    }, 0);
  }

  async getPagingByUserId(userId: string, query: CartGetPagingByUserREQ) {
    this.logger.log(`Get Paging By User Id: ${userId}`);
    const condition = CartGetPagingByUserREQ.toQueryCondition(userId, query);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.cartModel.countDocuments(condition);
    const carts = await this.cartModel.find(condition, {}, { lean: true }).sort({ updatedAt: -1 }).skip(skip).limit(limit);
    return PaginationResponse.ofWithTotalAndMessage(carts, total, 'Lấy giỏ hàng thành công!');
  }

  async getWithoutPagingByUserId(userId: string) {
    this.logger.log(`Get Without Paging By User Id: ${userId}`);
    const carts = await this.cartModel.find({ userId }, {}, { lean: true }).sort({ createdAt: -1 });
    return BaseResponse.withMessage(carts, 'Lấy giỏ hàng thành công!');
  }

  async getNewCartByUserId(userId: string) {
    this.logger.log(`Get New Cart By User Id: ${userId}`);
    const cart = await this.cartModel.find({ userId }).sort({ createdAt: -1 }).limit(1).lean();
    return BaseResponse.withMessage<Cart>(cart[0], 'Lấy giỏ hàng mới nhất thành công!');
  }

  async removeProductFromCart(userId: string, productId: string) {
    this.logger.log(`Remove Product From Cart: ${userId} - ${productId}`);
    const product = await this.productModel.findById(productId).lean();
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm này!');
    const store = await this.storeModel.findById(product.storeId).lean();
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const cart = await this.cartModel.findOne({ userId, storeId: store._id });
    if (cart.products.length === 1) {
      await this.cartModel.findByIdAndDelete(cart._id);
      return BaseResponse.withMessage({}, 'Xóa sản phẩm khỏi giỏ hàng thành công!');
    }
    const index = cart.products.findIndex((product) => product.id.toString() === productId.toString());
    cart.products.splice(index, 1);
    cart.totalPrice = this.getTotalPrice(cart.products);
    await cart.save();
    return BaseResponse.withMessage({}, 'Xóa sản phẩm khỏi giỏ hàng thành công!');
  }

  async removeMultiProductInCart(userId: string, storeId: string, products: ProductInfoDTO[]) {
    this.logger.log(`Remove Multi Product In Cart: ${userId} - ${storeId}`);
    const cart = await this.cartModel.findOne({ userId, storeId });
    products.forEach((product) => {
      const index = cart.products.findIndex((p) => p.id.toString() === product.id.toString());
      cart.products.splice(index, 1);
    });
    if (cart.products.length === 0) {
      await this.cartModel.findByIdAndDelete(cart._id);
      return;
    }
    cart.totalPrice = this.getTotalPrice(cart.products);
    await cart.save();
  }
}
