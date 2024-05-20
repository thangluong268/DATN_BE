import { IsEnum } from 'class-validator';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';

export class ConversationPreviewGetREQ extends PaginationREQ {
  @IsEnum(ROLE_NAME)
  senderRole: ROLE_NAME;
}
