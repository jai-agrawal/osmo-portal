import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, model, Schema as MongooseSchema } from 'mongoose';

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

  @Prop({ required: false })
  answer: string;
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class JobApplication extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Candidate',
    required: true,
  })
  candidateId: MongooseSchema.Types.ObjectId;

  @Prop({ required: false })
  candidateName: string;

  @Prop({ required: false })
  candidateEmail: string;

  @Prop({ required: false })
  candidatePhone: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Client',
    required: true,
  })
  clientId: MongooseSchema.Types.ObjectId;

  @Prop({ required: false })
  clientName: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Job',
    required: true,
  })
  jobId: MongooseSchema.Types.ObjectId;

  @Prop({ required: false })
  jobName: string;

  @Prop({ required: false })
  jobStatus: string;

  @Prop({
    required: true,
    default: 'PENDING_REVIEW',
    enum: [
      'PENDING_REVIEW',
      'IN_REVIEW',
      'NOT_SELECTED',
      'NOT_A_MATCH',
      'HIRED',
      // 'IN_PIPELINE',
    ],
  })
  status: string;

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

  @Prop({ required: false })
  candidateAvailability: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Recruiter',
    required: false,
  })
  assignedToId: MongooseSchema.Types.ObjectId;

  @Prop({ required: false })
  questions: Question[];

  @Prop({ required: false, default: 0 })
  totalApplicants: number;

  @Prop({ required: false, default: 0 })
  totalInPipeline: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ required: false })
  comments: {
    recruiterId: MongooseSchema.Types.ObjectId;
    recruiterName: string;
    comment: string;
    createdAt: Date;
  }[];
}

export const JobApplicationSchema =
  SchemaFactory.createForClass(JobApplication);

JobApplicationSchema.virtual('candidate', {
  ref: 'Candidate',
  localField: 'candidateId',
  foreignField: '_id',
  justOne: true,
});

JobApplicationSchema.virtual('client', {
  ref: 'Client',
  localField: 'clientId',
  foreignField: '_id',
  justOne: true,
});

JobApplicationSchema.virtual('job', {
  ref: 'Job',
  localField: 'jobId',
  foreignField: '_id',
  justOne: true,
});

JobApplicationSchema.virtual('resumeFile', {
  ref: 'File',
  localField: 'resumeFileId',
  foreignField: '_id',
  justOne: true,
});

JobApplicationSchema.virtual('portfolioFile', {
  ref: 'File',
  localField: 'portfolioFileId',
  foreignField: '_id',
  justOne: true,
});

JobApplicationSchema.virtual('additionalFiles', {
  ref: 'File',
  localField: 'additionalFileIds',
  foreignField: '_id',
});

JobApplicationSchema.virtual('assignedTo', {
  ref: 'Recruiter',
  localField: 'assignedToId',
  foreignField: '_id',
  justOne: true,
});

export const JobApplicationModel = model(
  'JobApplication',
  JobApplicationSchema,
);
