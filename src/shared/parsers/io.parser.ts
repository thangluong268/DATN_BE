import { isArray, isBoolean, isEmpty, isNull, isNumber, isUndefined, omitBy } from 'lodash';

export const orUndefined = (value?: any) => value || undefined;
export const orNull = (value?: any) => value || null;
export const notEmptyOrNull = (value?: any) => (isEmpty(value) ? null : value);

function isBlank(value: any) {
  return isEmpty(value) && !isNumber(value) && !isBoolean(value);
}

export function leanObject(myObject: any) {
  if (isNull(myObject) || typeof myObject !== 'object' || isArray(myObject)) return myObject;
  const returnObject = {};
  for (const key2 of Object.keys(myObject)) {
    const afterClean = leanObject(myObject[key2]);
    returnObject[key2] = !isNull(afterClean) && isBlank(afterClean) ? undefined : afterClean;
  }
  return omitBy(returnObject, isUndefined);
}
