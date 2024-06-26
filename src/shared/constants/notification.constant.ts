import { BILL_STATUS, BILL_STATUS_NOTIFICATION } from 'shared/enums/bill.enum';
import { NotificationType } from 'shared/enums/notification.enum';

export const NOTIFICATION_CONTENT = {
  [NotificationType.UPDATE_INFO]: 'Bạn vừa cập nhật thông tin cá nhân.',
  [NotificationType.FOLLOW]: 'đã theo dõi bạn.',
  [NotificationType.SENT_ADD_FRIEND]: 'đã gửi cho bạn lời mời kết bạn.',
  [NotificationType.ACCEPTED_ADD_FRIEND_OF_SENDER]: 'đã chấp nhận lời mời kết bạn của bạn.',
  [NotificationType.ACCEPTED_ADD_FRIEND_OF_RECEIVER]: 'Bạn đã chấp nhận lời mời kết bạn của',
  [NotificationType.REJECT_ADD_FRIEND]: 'Bạn đã từ chối lời mời kết bạn của',
  [NotificationType.NEW_POST]: 'vừa đăng một sản phẩm mới:',
  [NotificationType.EVALUATION]: 'đã bày tỏ cảm xúc về sản phẩm của bạn.',
  [NotificationType.FEEDBACK]: 'đã gửi phản hồi về sản phẩm của bạn.',
  [NotificationType.REPORT_FEEDBACK]: `Nội dung đánh giá của bạn đã vi phạm chính sách của chúng tôi.`,
  [BILL_STATUS.NEW]: 'Bạn đã đặt hàng thành công. Đơn hàng đang chờ xác nhận.',
  [BILL_STATUS.CONFIRMED]: 'Đơn hàng của bạn đã được xác nhận.',
  [BILL_STATUS.DELIVERING]: 'Đơn hàng của bạn đang được giao.',
  [BILL_STATUS.DELIVERED]: 'Đơn hàng của bạn đã được giao thành công.',
  [BILL_STATUS.CANCELLED]: 'Đơn hàng của bạn đã bị hủy.',
  [BILL_STATUS_NOTIFICATION.NEW_SELLER]: 'Người dùng vừa đặt hàng sản phẩm của bạn.',
  [BILL_STATUS_NOTIFICATION.REFUND_USER]: 'Bạn đã hoàn đơn hàng của mình.\nĐơn hàng đang chờ xác nhận hoàn từ shop.',
  [BILL_STATUS_NOTIFICATION.REFUND_SELLER]: 'Người mua đã hoàn đơn hàng. Vui lòng xác nhận.',
  [BILL_STATUS_NOTIFICATION.CONFIRMED_REFUND]: 'Đơn hàng đã được xác nhận hoàn trả thành công.',
  [BILL_STATUS_NOTIFICATION.BACK_USER]: 'Đơn hàng của bạn sẽ được trả lại cho shop.',
  [BILL_STATUS_NOTIFICATION.BACK_SELLER]: 'Người mua đã trả đơn hàng. Vui lòng xác nhận với shipper',
  [BILL_STATUS_NOTIFICATION.CONFIRM_DELIVERED_BY_USER]:
    'Người mua đã xác nhận nhận hàng.\nVui lòng kiểm tra đơn giao thành công.',
};

export const NOTIFICATION_LINK = {
  [NotificationType.UPDATE_INFO]: `/user/profile`,
  [NotificationType.FOLLOW]: '',
  [NotificationType.SENT_ADD_FRIEND]: '',
  [NotificationType.ACCEPTED_ADD_FRIEND_OF_SENDER]: '',
  [NotificationType.ACCEPTED_ADD_FRIEND_OF_RECEIVER]: '',
  [NotificationType.REJECT_ADD_FRIEND]: '',
  [NotificationType.NEW_POST]: `/product/`, // + product id
  [NotificationType.BILL]: `/user/invoice`,
  [NotificationType.EVALUATION]: `/product/`, // + product id
  [NotificationType.FEEDBACK]: `/product/`, // + product id
  [BILL_STATUS_NOTIFICATION.NEW_SELLER]: `/shop/seller/`, // + store id
  [BILL_STATUS.DELIVERING]: `/shop/seller/`, // + store id
  [BILL_STATUS.DELIVERED]: `/shop/seller/`, // + store id
  [BILL_STATUS.BACK]: `/shop/seller/`, // + store id
  [BILL_STATUS.REFUND]: `/shop/seller/`, // + store id
};

export const NOTIFICATION_CONTENT_AUTO_BILL_SUCCESS = (storeName: string) =>
  `Cảm ơn bạn đã mua sắm tại ${storeName}.\nMọi thắc mắc vui lòng liên hệ shop để được hỗ trợ.`;
