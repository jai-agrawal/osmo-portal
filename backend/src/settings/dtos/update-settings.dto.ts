import { IsObject } from 'class-validator';

export class UpdateSettingsDto {
  @IsObject()
  settings: {
    [key: string]: {
      isSingleChoice: boolean;
      options: string[];
    };
  };
}
