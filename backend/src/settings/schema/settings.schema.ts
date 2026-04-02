import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, model } from 'mongoose';

@Schema({ timestamps: true })
export class Settings extends Document {
  @Prop({ required: true, default: {}, type: Object })
  settings: {
    [key: string]: {
      isSingleChoice: boolean;
      label: string;
      options: string[];
    };
  };
}
const SettingsSchema = SchemaFactory.createForClass(Settings);

export { SettingsSchema };

export const settingsModel = model('Settings', SettingsSchema);
