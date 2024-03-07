import { User } from 'domains/user/schema/user.schema';
import { Feedback } from '../schema/feedback.schema';

export class FeedbackGetRESP {
  star: number;
  content: string;
  avatar: string;
  name: string;
  consensus: string[];
  isConsensus: boolean;
  createdAt: Date;
  userId: string;

  static of(user: any, userFeedback: User, feedback: Feedback): FeedbackGetRESP {
    return {
      star: feedback.star,
      content: feedback.content,
      avatar: userFeedback.avatar,
      name: userFeedback.fullName,
      consensus: feedback.consensus,
      isConsensus: user ? feedback.consensus.includes(user._id) : false,
      createdAt: feedback['createdAt'],
      userId: feedback.userId,
    };
  }
}
