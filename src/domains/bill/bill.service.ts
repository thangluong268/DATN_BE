import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CartService } from 'domains/cart/cart.service';
import { ProductService } from 'domains/product/product.service';
import { StoreService } from 'domains/store/store.service';
import { UserService } from 'domains/user/user.service';
import { Connection, Model } from 'mongoose';
import { BILL_STATUS } from 'shared/constants/bill.constant';
import { BaseResponse } from 'shared/generics/base.response';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { ProductInfoDTO } from './dto/product-info.dto';
import { BillCreateREQ } from './request/bill-create.request';
import { BillGetTotalByStatusSellerREQ } from './request/bill-get-total-by-status-seller.request';
import { Bill } from './schema/bill.schema';

@Injectable()
export class BillService {
  constructor(
    @InjectModel(Bill.name)
    private readonly billModel: Model<Bill>,
    @InjectConnection()
    private readonly connection: Connection,

    private readonly userService: UserService,
    private readonly productService: ProductService,
    private readonly cartService: CartService,
    private readonly storeService: StoreService,
  ) {}

  async create(userId: string, body: BillCreateREQ) {
    const user = await this.userService.findById(userId);
    if (!user) return new NotFoundException('Không tìm thấy người dùng này!');
    const newBills = [];
    for (const cart of body.data) {
      const session = await this.connection.startSession();
      session.startTransaction();
      try {
        await this.userService.updateWallet(userId, cart.totalPrice, 'plus');
        await this.cartService.removeMultiProductInCart(userId, cart.storeId, cart.products);
        for (const product of cart.products) {
          await this.productService.decreaseQuantity(product.id, product.quantity);
        }
        cart.products.forEach((product: ProductInfoDTO) => {
          product.type = product.type.toUpperCase();
        });
        const newBill = await this.billModel.create(cart);
        BillCreateREQ.saveData(newBill, userId, body);
        newBills.push(newBill);
      } catch (err) {
        await session.abortTransaction();
        throw err;
      }
    }
    return newBills.map((bill) => toDocModel(bill));
  }

  async countTotalByStatusSeller(userId: string, year: number) {
    const user = await this.userService.findById(userId);
    if (!user) return new NotFoundException('Không tìm thấy người dùng này!');
    const store = await this.storeService.findByUserId(userId);
    if (!store) return new NotFoundException('Không tìm thấy cửa hàng này!');
    const statusData: string[] = BILL_STATUS.split('-').map((item: string) => item.toUpperCase());
    const countTotal = await Promise.all(
      statusData.map(async (status: string) => {
        return this.billModel.countDocuments(BillGetTotalByStatusSellerREQ.toQueryCondition(store._id, status, year));
      }),
    );
    const transformedData = Object.fromEntries(countTotal.map((value, index) => [statusData[index], value]));
    return BaseResponse.withMessage<{ [k: string]: number }>(
      transformedData,
      'Lấy tổng số lượng các đơn theo trạng thái thành công!',
    );
  }
}
