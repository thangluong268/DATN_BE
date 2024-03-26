import { Store } from 'domains/store/schema/store.schema';
import { User } from 'domains/user/schema/user.schema';
import { BillUser } from '../schema/bill-user.schema';

export class GetMyBillRESP {
  static of(bill: BillUser, store: Store, user: User, products: any) {
    delete user.password;
    return {
      // _id: bill._id,
      // storeInfo: store,
      // listProductsFullInfo: products,
      // user,
      // notes: bill.notes,
      // totalPrice: bill.totalPrice,
      // deliveryMethod: bill.deliveryMethod,
      // paymentMethod: bill.paymentMethod,
      // receiverInfo: bill.receiverInfo,
      // giveInfo: bill.giveInfo,
      // deliveryFee: bill.deliveryFee,
      // status: bill.status,
      // isPaid: bill.isPaid,
      // createdAt: bill['createdAt'],
    };
  }
}
