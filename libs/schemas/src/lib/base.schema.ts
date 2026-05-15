import { ObjectId } from 'mongodb';
import { Prop, SchemaFactory, Virtual } from '@nestjs/mongoose';
import { Type } from '@nestjs/common';

export class BaseSchema {
  _id: ObjectId;

  @Virtual({
    get: function (this: { _id?: ObjectId }) {
      return this?._id ? this._id.toString() : undefined;
    },
  })
  id?: string;

  @Prop({ type: Date, default: new Date() })
  createdAt: Date;

  @Prop({ type: Date, default: new Date() })
  updatedAt: Date;
}

export const createSchema = <TClass extends BaseSchema>(target: Type<TClass>): any => {
  const schema = SchemaFactory.createForClass(target);

  schema.set('toJSON', { virtuals: true });
  schema.set('toObject', { virtuals: true });
  schema.set('versionKey', false);
  schema.set('timestamps', true);

  return schema;
};
