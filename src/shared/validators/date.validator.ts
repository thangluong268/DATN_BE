import { Transform } from 'class-transformer';
import { IsDate } from 'class-validator';

export function DateValidator() {
  return function (object: object, propertyName: string) {
    IsDate({ message: 'Must be formatted start with yyyy-mm-dd*' })(object, propertyName);
    Transform(({ value }) => (value ? new Date(value) : null))(object, propertyName);
  };
}
