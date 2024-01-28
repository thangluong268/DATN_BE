import { isBoolean, isEmpty, isNumber } from 'lodash';

/*
  isBlank(undefined)
  // => true

  isBlank(null)
  // => true

  isBlank('')
  // => true

  isBlank([])
  // => true

  isBlank({})
  // => true

  isBlank(NaN)
  // => true

  isBlank(0)
  // => false
*/
export function isBlank(value: any) {
  return isEmpty(value) && !isNumber(value) && !isBoolean(value);
}
