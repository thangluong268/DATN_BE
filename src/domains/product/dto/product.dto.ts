import { Product } from '../schema/product.schema';

export class ProductDTO {
  id: string;
  avatar: string[];
  name: string;
  oldPrice: number;
  newPrice: number;
  quantity: number;

  static toNewCart(product: Product) {
    return {
      id: product._id,
      avatar: product.avatar,
      name: product.name,
      oldPrice: product.oldPrice,
      newPrice: product.newPrice,
      quantity: 1,
    };
  }
}
