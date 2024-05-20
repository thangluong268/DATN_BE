import { IsEnum } from 'class-validator';
import { ROLE_NAME } from 'shared/enums/role-name.enum';

export class ConversationCountUnReadREQ {
  @IsEnum(ROLE_NAME)
  senderRole: ROLE_NAME;
}
