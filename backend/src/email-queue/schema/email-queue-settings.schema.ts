import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class EmailQueueSettings extends Document {
  @Prop({ default: false })
  isPaused: boolean;
}

export const EmailQueueSettingsSchema = SchemaFactory.createForClass(EmailQueueSettings);
