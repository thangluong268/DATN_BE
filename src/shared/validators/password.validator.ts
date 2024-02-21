import { IsString, Length, Matches } from 'class-validator';

export function PasswordValidator() {
  return function (object: object, propertyName: string) {
    IsString({ message: 'password must be a string' })(object, propertyName);
    Length(6, 20, {
      message: 'Mật khẩu phải từ 6 đến 20 ký tự',
    })(object, propertyName);
    Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z])/, {
      message:
        'Mật khẩu chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
      each: true,
    })(object, propertyName);
  };
}
