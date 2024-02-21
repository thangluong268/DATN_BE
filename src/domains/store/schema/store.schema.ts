import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, FlattenMaps, Types, UpdateWriteOpResult } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Store extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop()
  avatar: string;

  @Prop()
  name: string;

  @Prop()
  address: string;

  @Prop({ types: [String] })
  phoneNumber: string[];

  @Prop()
  description: string;

  @Prop({ default: 0 })
  warningCount: number;

  @Prop({ default: true })
  status: boolean;

  static toDocModel(
    store:
      | (Document<unknown, `object`, Store> &
          Store & {
            _id: Types.ObjectId;
          })
      | UpdateWriteOpResult
      | (FlattenMaps<Store> & {
          _id: Types.ObjectId;
        }),
  ): Store {
    return store['_doc'] ? store['_doc'] : store;
  }
}

export const StoreSchema = SchemaFactory.createForClass(Store);
