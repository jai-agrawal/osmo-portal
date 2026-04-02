import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class File extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  key: string;

  @Prop({ required: false })
  url: string;

  @Prop({ required: false })
  signedUrl: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  extension: string;

  @Prop({ required: false, default: false })
  isDeleted: boolean;

  @Prop({ required: false, ref: 'User' })
  createdById: string;

  @Prop({ required: false, ref: 'User' })
  updatedById: string;
}

export const FileSchema = SchemaFactory.createForClass(File);

FileSchema.index({ createdAt: 1, updatedAt: 1 });
