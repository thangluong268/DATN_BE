import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export function BooleanValidator() {
  return function (object: object, propertyName: string) {
    IsBoolean()(object, propertyName);
    Transform(({ value }) => value === 'true')(object, propertyName);
  };
}
