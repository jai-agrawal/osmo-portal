import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateFileDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  key: string;

  @IsString()
  url: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @IsNotEmpty()
  size: number;

  @IsString()
  @IsNotEmpty()
  extension: string;

  @IsString()
  @IsOptional()
  signedUrl: string;
}
