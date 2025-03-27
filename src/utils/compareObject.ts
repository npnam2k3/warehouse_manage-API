import { isEqual, pick } from 'lodash';

export const compareObject = (object1: Object, object2: Object) => {
  return isEqual(object1, object2);
};

export const getInfoObject = (fields: string[] = [], object: {}) => {
  return pick(object, fields);
};
