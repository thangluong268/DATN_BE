import { Store } from 'domains/store/schema/store.schema';
import { User } from 'domains/user/schema/user.schema';
import { BillUser } from '../schema/bill-user.schema';

export class BillGetAllByStatusUserRESP {
  static of(bill: BillUser, store: Store, products: any, user: User) {
    delete user.password;
    return {
      // _id: bill._id,
      // storeInfo: store,
      // listProductsFullInfo: products,
      // userInfo: user,
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
