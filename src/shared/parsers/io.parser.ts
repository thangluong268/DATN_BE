import { isEmpty } from 'lodash';

export const orUndefined = (value?: any) => value || undefined;
export const orNull = (value?: any) => value || null;
export const notEmptyOrNull = (value?: any) => (isEmpty(value) ? null : value);
