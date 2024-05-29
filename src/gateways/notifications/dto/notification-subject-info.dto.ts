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

  static ofProduct(id: string, name: string, avatar: string): NotificationSubjectInfoDTO {
    return {
      subjectId: id,
      subjectAvatar: avatar,
      subjectName: name,
    };
  }
}
