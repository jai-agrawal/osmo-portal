import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  jobType: string;

  @IsString()
  @IsNotEmpty()
  experience: string;

  @IsNumber()
  @IsOptional()
  minExperienceLevel: number;

  @IsNumber()
  @IsOptional()
  maxExperienceLevel: number;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  workType: string;

  @IsString()
  @IsNotEmpty()
  workingDays: string;

  @IsString()
  @IsOptional()
  ctcRange: string;

  @IsString()
  @IsNotEmpty()
  minAnnualCtc: number;

  @IsString()
  @IsNotEmpty()
  maxAnnualCtc: number;

  @IsString()
  @IsNotEmpty()
  roleTypes: string[];

  @IsString()
  @IsOptional()
  shortDescription: string;

  @IsString()
  @IsNotEmpty()
  overview: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  recruiterId: string;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsString()
  @IsNotEmpty()
  clientCode: string;

  @IsString()
  @IsOptional()
  status: string;

  @IsString()
  @IsOptional()
  additionalInfo: string;
}
