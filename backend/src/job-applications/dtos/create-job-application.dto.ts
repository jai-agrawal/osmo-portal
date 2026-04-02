import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class QuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  questionType: 'shortAnswer' | 'multipleChoice' | 'yesNo';

  @IsArray()
  @IsOptional()
  choices?: string[];

  @IsBoolean()
  @IsOptional()
  addOther?: boolean;

  @IsString()
  @IsOptional()
  answer?: string;
}

class SocialUrlsDto {
  @IsString()
  @IsOptional()
  linkedin?: string;

  @IsString()
  @IsOptional()
  website?: string;
}

export class CreateJobApplicationDto {
  @IsString()
  @IsNotEmpty()
  candidateId: string;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  jobId: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  resumeFileId?: string;

  @IsString()
  @IsOptional()
  portfolioFileId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  additionalFileIds?: string[];

  @ValidateNested()
  @Type(() => SocialUrlsDto)
  @IsOptional()
  socialUrls?: SocialUrlsDto;

  @IsString()
  @IsOptional()
  expectedCtc?: string;

  @IsNumber()
  @IsOptional()
  minExpectedCtc?: number;

  @IsNumber()
  @IsOptional()
  maxExpectedCtc?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  areaOfExpertise?: string[];

  @IsString()
  @IsOptional()
  experienceLevel?: string;

  @IsNumber()
  @IsOptional()
  minExperienceLevel?: number;

  @IsNumber()
  @IsOptional()
  maxExperienceLevel?: number;

  @IsString()
  @IsOptional()
  locationPreference?: string[];

  @IsString()
  @IsOptional()
  candidateAvailability?: string;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  @IsOptional()
  questions?: QuestionDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  comments?: {
    recruiterId: string;
    recruiterName: string;
    comment: string;
    createdAt: Date;
  }[];

  // Replication
  @IsBoolean()
  @IsOptional()
  isDeleted?: boolean;

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsString()
  @IsOptional()
  jobName?: string;

  @IsString()
  @IsOptional()
  jobStatus?: string;

  @IsString()
  @IsOptional()
  candidateName?: string;

  @IsString()
  @IsOptional()
  candidateEmail?: string;

  @IsOptional()
  assignedToId?: string;
}
