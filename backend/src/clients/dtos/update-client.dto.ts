import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateClientDto } from './create-client.dto';

export class UpdateClientDto extends CreateClientDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsOptional()
  @IsBoolean()
  isDeleted: boolean;
}
