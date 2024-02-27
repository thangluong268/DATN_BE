import { IsEnum, IsNotEmpty } from 'class-validator';
import { ROLE_NAME } from 'shared/enums/role-name.enum';

export class AuthSetRoleUserREQ {
  @IsNotEmpty()
  @IsEnum(ROLE_NAME)
  role: ROLE_NAME;
}
