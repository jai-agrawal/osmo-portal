import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  ValidateNested,
  IsUrl,
  IsEmail,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

class SocialUrlsDto {
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  linkedin: string;

  @IsString()
  @IsUrl()
  @IsNotEmpty()
  instagram: string;
}

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => SocialUrlsDto)
  @IsOptional()
  socialUrls?: SocialUrlsDto;

  @IsString()
  @IsOptional()
  workingDays?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isDeleted: boolean;

  @IsString()
  @IsOptional()
  address?: string;
}
