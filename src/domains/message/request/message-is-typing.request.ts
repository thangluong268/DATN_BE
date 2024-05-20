import { ConversationRoomREQ } from 'gateways/conversations/request/conversation-room.request';
import { BooleanValidator } from 'shared/validators/boolean-query.validator';

export class MessageIsTypingREQ extends ConversationRoomREQ {
  @BooleanValidator()
  isTyping: boolean;
}
