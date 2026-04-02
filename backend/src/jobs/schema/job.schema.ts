import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, model, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class RecruiterInfoVisibility {
  @Prop({ default: false })
  isEmailVisible: boolean;

  @Prop({ default: false })
  isPhoneVisible: boolean;

  @Prop({ default: false })
  isLinkedInVisible: boolean;
}

@Schema({ timestamps: false, _id: false })
export class JobDescription {
  @Prop({ required: true })
  companyOverview: string;

  @Prop({ required: false })
  shortDescription: string;

  @Prop({ required: false })
  whoLookingFor: string;

  @Prop({ required: true })
  responsibilities: string;

  @Prop({ required: true })
  qualifications: string;

  @Prop({ required: false })
  additionalInfo: string;
}

@Schema({ timestamps: false, _id: false })
export class Question {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  questionType: 'shortAnswer' | 'multipleChoice' | 'yesNo';

  @Prop({ required: false })
  choices: string[];

  @Prop({ required: false })
  addOther: boolean;
}

@Schema({ timestamps: true })
export class Job extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  jobType: string;

  @Prop({ required: false })
  experience: string;

  @Prop({ required: false })
  minExperienceLevel: number;

  @Prop({ required: false })
  maxExperienceLevel: number;

  @Prop({ required: true })
  location: string;

  @Prop({ required: false })
  roleType: string;

  @Prop({ required: false })
  roleTypes: string[];

  @Prop({ required: false })
  workType: string;

  @Prop({ required: false })
  workingDays: string;

  @Prop({ required: false })
  ctcRange?: string;

  @Prop({ required: false })
  minAnnualCtc: number;

  @Prop({ required: false })
  maxAnnualCtc: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Recruiter',
    required: false,
  })
  recruiterId: MongooseSchema.Types.ObjectId;

  @Prop({ type: RecruiterInfoVisibility, required: true })
  recruiterInfoVisibility: RecruiterInfoVisibility;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Client',
    required: true,
  })
  clientId: MongooseSchema.Types.ObjectId;

  @Prop({ required: false })
  clientName: string;

  @Prop({ required: false })
  clientCode: string;

  @Prop({ required: false })
  overview: string;

  @Prop({ required: true })
  jobDescription: JobDescription;

  @Prop({ required: false })
  content: string;

  @Prop({ required: false })
  questions: Question[];

  @Prop({ required: false })
  skills: string[];

  @Prop({
    default: 'DRAFT',
    enum: ['ACTIVE', 'INACTIVE', 'DRAFT', 'CLOSED'],
  })
  status: string;

  @Prop({ required: false })
  companyOverview: string;

  @Prop({ required: false })
  shortDescription: string;

  @Prop({ required: false })
  whoLookingFor: string;

  @Prop({ required: false })
  responsibilities: string;

  @Prop({ required: false })
  qualifications: string;

  @Prop({ required: false })
  additionalInfo: string;

  @Prop({ required: false, default: false })
  isDeleted: boolean;

  @Prop({ required: false })
  totalApplicants: number;

  @Prop({ required: false })
  totalInPipeline: number;
}

export const JobSchema = SchemaFactory.createForClass(Job);

JobSchema.virtual('recruiter', {
  ref: 'Recruiter',
  localField: 'recruiterId',
  foreignField: '_id',
  justOne: true,
});

JobSchema.virtual('client', {
  ref: 'Client',
  localField: 'clientId',
  foreignField: '_id',
  justOne: true,
});
JobSchema.set('toObject', { virtuals: true });
JobSchema.set('toJSON', { virtuals: true });

export const JobModel = model('Job', JobSchema);
