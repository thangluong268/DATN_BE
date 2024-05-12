import { PasswordValidator } from 'shared/validators/password.validator';

export class ShipperChangePasswordREQ {
  @PasswordValidator()
  oldPassword: string;

  @PasswordValidator()
  newPassword: string;
}
