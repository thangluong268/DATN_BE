import { isArray, isBoolean, isEmpty, isNil, isNumber, omitBy } from 'lodash';

export const orUndefined = (value?: any) => value || undefined;
export const orNull = (value?: any) => value || null;
export const notEmptyOrNull = (value?: any) => (isEmpty(value) ? null : value);

function isBlank(value: any) {
  return isEmpty(value) && !isNumber(value) && !isBoolean(value);
}

export function leanObject(myObject: any) {
  if (typeof myObject !== 'object' || isArray(myObject)) return myObject;
  const returnObject = {};
  for (const key2 of Object.keys(myObject)) {
    const afterClean = leanObject(myObject[key2]);
    returnObject[key2] = isBlank(afterClean) ? null : afterClean;
  }
  return omitBy(returnObject, isNil);
}
