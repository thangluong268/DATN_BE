import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export function BooleanValidator() {
  return function (object: object, propertyName: string) {
    IsBoolean()(object, propertyName);
    Transform(({ value }) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    })(object, propertyName);
  };
}
