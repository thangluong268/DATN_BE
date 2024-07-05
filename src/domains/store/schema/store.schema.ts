import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, FlattenMaps, Types, UpdateWriteOpResult } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
}) //
export class Store extends Document {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String })
  avatar: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  address: string;

  @Prop({ types: [String] })
  phoneNumber: string[];

  @Prop({ type: String })
  description: string;

  @Prop({ type: Boolean, default: 0 })
  warningCount: number;

  @Prop({ type: Boolean, default: true })
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
