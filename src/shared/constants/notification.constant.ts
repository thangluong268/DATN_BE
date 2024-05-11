import { NotificationType } from 'shared/enums/notification.enum';

export const NOTIFICATION_CONTENT = {
  [NotificationType.UPDATE_INFO]: 'Bạn vừa cập nhật thông tin cá nhân.',
  [NotificationType.FOLLOW]: 'đã theo dõi bạn.',
  [NotificationType.SENT_ADD_FRIEND]: 'đã gửi cho bạn lời mời kết bạn.',
  [NotificationType.ACCEPTED_ADD_FRIEND_OF_SENDER]: 'đã chấp nhận lời mời kết bạn của bạn.',
  [NotificationType.ACCEPTED_ADD_FRIEND_OF_RECEIVER]: 'Bạn đã chấp nhận lời mời kết bạn của',
  [NotificationType.REJECT_ADD_FRIEND]: 'Bạn đã từ chối lời mời kết bạn của',
  [NotificationType.NEW_POST]: 'vừa đăng một sản phẩm mới:',
  [NotificationType.BILL]: 'đơn hàng của bạn',
  [NotificationType.EVALUATION]: 'đã bày tỏ cảm xúc về sản phẩm của bạn.',
  [NotificationType.FEEDBACK]: 'đã gửi phản hồi về sản phẩm của bạn.',
};
