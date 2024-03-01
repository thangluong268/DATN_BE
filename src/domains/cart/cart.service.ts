import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ProductDTO } from 'domains/product/dto/product.dto';
import { ProductService } from 'domains/product/product.service';
import { Product } from 'domains/product/schema/product.schema';
import { Store } from 'domains/store/schema/store.schema';
import { StoreService } from 'domains/store/store.service';
import { Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { Cart } from './schema/cart.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<Cart>,

    private readonly productService: ProductService,
    private readonly storeService: StoreService,
  ) {}

  async handleAddProductIntoCart(userId: string, productId: string) {
    const product = await this.productService.findById(productId);
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm này!');
    }
    const store = await this.storeService.findById(product.storeId);
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
          result = await this.increaseProductQuantity(cartOfStore, productId);
        }
      }
    }

    return BaseResponse.withMessage<Cart>(result, 'Thêm sản phẩm vào giỏ hàng thành công!');
  }

  async create(userId: string, store: Store, product: Product) {
    const productIntoCart = ProductDTO.toNewCart(product);
    const newCart = await this.cartModel.create({
      userId,
      storeId: store._id,
      storeAvatar: store.avatar,
      storeName: store.name,
      products: [productIntoCart],
    });
    newCart.totalPrice = this.getToTalPrice(newCart.products);
    await newCart.save();
    return toDocModel(newCart);
  }

  async addNewProductIntoCartOfStore(cart: Cart, product: ProductDTO) {
    cart.products.push(product);
    cart.totalPrice = this.getToTalPrice(cart.products);
    return await this.cartModel.findByIdAndUpdate(cart._id, cart, {
      lean: true,
      new: true,
    });
  }

  async increaseProductQuantity(cart: Cart, productId: string) {
    const product = cart.products.find((product) => product.id.toString() === productId.toString());
    product.quantity += 1;
    cart.totalPrice = this.getToTalPrice(cart.products);
    return await this.cartModel.findByIdAndUpdate(cart._id, cart, {
      lean: true,
      new: true,
    });
  }

  private getToTalPrice(products: ProductDTO[]) {
    return products.reduce((total, product) => {
      return total + product.newPrice * product.quantity;
    }, 0);
  }
}
