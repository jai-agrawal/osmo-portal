import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  MinLength,
} from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  readonly mobile: string;

  @IsDate()
  @IsOptional()
  readonly dateOfBirth: Date;

  @IsString()
  // @IsNotEmpty()
  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsNumber()
  @IsOptional()
  minExpectedCtc?: number;

  @IsNumber()
  @IsOptional()
  maxExpectedCtc?: number;

  @IsOptional()
  readonly resumeFileId?: string;

  @IsOptional()
  readonly portfolioFileIds?: string[];

  @IsOptional()
  readonly additionalFileIds?: string[];

  @IsOptional()
  readonly socialUrls?: {
    linkedin?: string;
    website?: string;
  };

  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE';

  @IsOptional()
  isDeleted?: boolean;

  @IsOptional()
  createdBy?: string;

  @IsOptional()
  savedJobIds?: string[];
}
