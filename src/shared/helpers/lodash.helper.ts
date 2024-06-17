import * as _ from 'lodash';

export const isArrayIncludeObject = (array: any[], object: any) => {
  const found = _.find(array, (item) => _.isEqual(item, object));
  return !!found; // double ! -> convert to boolean
};
