import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

@Schema({ timestamps: true })
export class Client extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  code: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: false })
  website: string;

  @Prop({ required: false })
  email: string;

  @Prop({ required: false })
  phone: string;

  @Prop({
    type: {
      linkedin: { type: String, required: false },
      instagram: { type: String, required: false },
    },
    _id: false,
  })
  socialUrls: {
    linkedin: string;
    instagram: string;
  };

  @Prop({ required: false })
  workingDays?: string;

  @Prop({ required: false })
  workTimings: string;

  @Prop({ required: false })
  address: string;

  @Prop({ required: false })
  notes?: string;

  @Prop({ required: false, default: false })
  isDeleted: boolean;
}

const ClientSchema = SchemaFactory.createForClass(Client);

const generateUniqueCode = async function (
  name: string,
  model: Model<Client>,
): Promise<string> {
  // Name prefix is not needed for now
  // const namePrefix = name.split(' ')[0].slice(0, 3).toUpperCase();
  const generateCode = () =>
    `${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  let code = generateCode();
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 5) {
    const existingClient = await model.findOne({ code });
    if (!existingClient) {
      isUnique = true;
    } else {
      code = generateCode();
      attempts++;
    }
  }

  return code;
};

ClientSchema.pre('save', async function (next) {
  if (this.isNew) {
    this.code = await generateUniqueCode(
      this.name,
      this.constructor as Model<Client>,
    );
  }
  next();
});

export { ClientSchema };
