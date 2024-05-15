import { FeedbackShipper } from '../schema/feedback-shipper.schema';

export class FeedbackShipperDetailRES {
  id: string;
  billId: string;
  userId: string;
  userAvatar: string;
  userName: string;
  shipperId: string;
  shipperAvatar: string;
  shipperName: string;
  star: number;
  content: string;
  createdAt: Date;

  static of(feedback: FeedbackShipper): FeedbackShipperDetailRES {
    return {
      id: feedback._id,
      billId: feedback.billId,
      userId: feedback.userId,
      userAvatar: feedback['user'].avatar,
      userName: feedback['user'].fullName,
      shipperId: feedback.shipperId,
      shipperAvatar: feedback['shipper'].avatar,
      shipperName: feedback['shipper'].fullName,
      star: feedback.star,
      content: feedback.content,
      createdAt: feedback['createdAt'],
    };
  }
}
