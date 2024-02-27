import { Document, FlattenMaps, Types, UpdateWriteOpResult } from 'mongoose';

export const toDocModel = <T>(
  model:
    | (Document<unknown, `object`, T> &
        T & {
          _id: Types.ObjectId;
        })
    | UpdateWriteOpResult
    | (FlattenMaps<T> & {
        _id: Types.ObjectId;
      }),
): T => {
  return model['_doc'] ? model['_doc'] : model;
};
