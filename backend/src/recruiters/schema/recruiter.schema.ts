import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { generatePassword, comparePassword } from 'src/common/utils/password';

@Schema({ timestamps: true })
export class Recruiter extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({
    type: {
      linkedin: { type: String, required: false },
    },
    _id: false,
  })
  socialUrls: {
    linkedin: string;
  };

  @Prop({ required: true })
  mobile: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({
    type: String,
    select: false,
    required: false,
  })
  resetPasswordToken?: string;

  @Prop({
    type: Date,
    select: false,
    required: false,
  })
  resetPasswordTokenExpires?: Date;

  @Prop({ default: false })
  isAdmin: boolean;

  async comparePassword(password: string): Promise<boolean> {
    return comparePassword(password, this.password);
  }
}

const RecruiterSchema = SchemaFactory.createForClass(Recruiter);

// Pre-save hook to hash the password
RecruiterSchema.pre<Recruiter>('save', async function (next) {
  if (!this.isModified('password')) return next();
  // this.password = await generatePassword(this.password);
  next();
});

export { RecruiterSchema };
