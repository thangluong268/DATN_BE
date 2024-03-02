import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CartService } from 'domains/cart/cart.service';
import { ProductService } from 'domains/product/product.service';
import { UserService } from 'domains/user/user.service';
import { Model } from 'mongoose';
import { BillCreateREQ } from './request/bill-create.request';
import { Bill } from './schema/bill.schema';

@Injectable()
export class BillService {
  constructor(
    @InjectModel(Bill.name)
    private readonly billModel: Model<Bill>,

    private readonly userService: UserService,
    private readonly productService: ProductService,
    private readonly cartService: CartService,
  ) {}

  async create(userId: string, body: BillCreateREQ) {
    const user = await this.userService.findById(userId);
    if (!user) return new NotFoundException('Không tìm thấy người dùng này!');
    for (const bill of body.data) {
      await this.userService.updateWallet(userId, bill.totalPrice, 'plus');
      await this.cartService.removeMultiProductInCart(userId, bill.storeId, bill.products);
      for (const product of bill.products) {
        await this.productService.decreaseQuantity(product.id, product.quantity);
      }
      //   const newBill = await this.billModel.create(
      //     userId,
      //     bill,
      //     createBillDto.deliveryMethod,
      //     createBillDto.paymentMethod,
      //     createBillDto.receiverInfo,
      //     createBillDto.giveInfo,
      //     createBillDto.deliveryFee,
      //   );

      //   return newBill;
    }
  }
}
