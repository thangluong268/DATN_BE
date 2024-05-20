import { IsEnum, IsString } from 'class-validator';
import { ROLE_NAME } from 'shared/enums/role-name.enum';

export class ConversationRoomREQ {
  @IsEnum(ROLE_NAME)
  senderRole: ROLE_NAME;

  @IsString()
  receiverId: string;

  @IsEnum(ROLE_NAME)
  receiverRole: ROLE_NAME;
}
