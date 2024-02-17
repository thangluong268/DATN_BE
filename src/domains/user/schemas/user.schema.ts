import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class User extends Document {
  @Prop()
  avatar: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  role: string[];

  static toDocModel(user: User): User {
    return user['_doc'];
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
