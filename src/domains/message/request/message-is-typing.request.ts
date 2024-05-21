import { IsEnum } from 'class-validator';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { BooleanValidator } from 'shared/validators/boolean-query.validator';

export class MessageIsTypingREQ {
  @IsEnum(ROLE_NAME)
  senderRole: ROLE_NAME;

  @BooleanValidator()
  isTyping: boolean;
}
