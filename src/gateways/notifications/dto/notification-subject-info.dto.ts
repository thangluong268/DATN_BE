import { Product } from 'domains/product/schema/product.schema';
import { Store } from 'domains/store/schema/store.schema';
import { User } from 'domains/user/schema/user.schema';

export class NotificationSubjectInfoDTO {
  subjectId: string;
  subjectAvatar: string;
  subjectName: string;

  static ofUser(user: User): NotificationSubjectInfoDTO {
    return {
      subjectId: user._id.toString(),
      subjectAvatar: user.avatar,
      subjectName: user.fullName,
    };
  }

  static ofStore(store: Store): NotificationSubjectInfoDTO {
    return {
      subjectId: store._id.toString(),
      subjectAvatar: store.avatar,
      subjectName: store.name,
    };
  }

  static ofProduct(product: Partial<Product>): NotificationSubjectInfoDTO {
    return {
      subjectId: product.id.toString(),
      subjectAvatar: product.avatar[0],
      subjectName: product.name,
    };
  }
}
