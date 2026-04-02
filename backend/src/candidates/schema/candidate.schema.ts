import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, model, Schema as MongooseSchema } from 'mongoose';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Candidate extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false })
  mobile: string;

  @Prop({ required: true, default: '+91' })
  mobileCode: string;

  @Prop({ required: false })
  dateOfBirth: Date;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'File',
    required: false,
  })
  resumeFileId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'File',
    required: false,
  })
  portfolioFileId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    ref: 'File',
    required: false,
  })
  additionalFileIds: MongooseSchema.Types.ObjectId[];

  @Prop({
    type: {
      linkedin: { type: String, required: false },
      website: { type: String, required: false },
    },
    _id: false,
  })
  socialUrls: { linkedin: string; website: string };

  @Prop({ required: false })
  expectedCtc: string;

  @Prop({ required: false })
  minExpectedCtc: number;

  @Prop({ required: false })
  maxExpectedCtc: number;

  @Prop({ required: false })
  areaOfExpertise: string[];

  @Prop({ required: false })
  experienceLevel: string;

  @Prop({ required: false })
  minExperienceLevel: number;

  @Prop({ required: false })
  maxExperienceLevel: number;

  @Prop({ required: false })
  locationPreference: string[];

  @Prop({ default: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  status: string;

  @Prop({ required: false })
  candidateAvailability: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Recruiter',
    required: false,
  })
  assignedToId: MongooseSchema.Types.ObjectId;

  @Prop({
    required: false,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Recruiter',
  })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ required: false })
  resetPasswordToken?: string;

  @Prop({ required: false })
  resetPasswordTokenExpires?: Date;

  @Prop({ required: false })
  verifyToken?: string;

  @Prop({ required: false })
  verifyTokenExpires?: Date;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ required: false })
  savedJobIds: string[];

  @Prop({ required: false, default: 'local' })
  authProvider: string;
}

const CandidateSchema = SchemaFactory.createForClass(Candidate);

CandidateSchema.virtual('resumeFile', {
  ref: 'File',
  localField: 'resumeFileId',
  foreignField: '_id',
  justOne: true,
});

CandidateSchema.virtual('portfolioFile', {
  ref: 'File',
  localField: 'portfolioFileId',
  foreignField: '_id',
  justOne: true,
});

CandidateSchema.virtual('additionalFiles', {
  ref: 'File',
  localField: 'additionalFileIds',
  foreignField: '_id',
});

CandidateSchema.virtual('recruiter', {
  ref: 'Recruiter',
  localField: 'assignedToId',
  foreignField: '_id',
  justOne: true,
});

export const CandidateModel = model('Candidate', CandidateSchema);

export { CandidateSchema };
