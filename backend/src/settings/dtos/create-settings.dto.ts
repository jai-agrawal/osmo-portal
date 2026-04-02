import { IsObject } from 'class-validator';

export class CreateSettingsDto {
  @IsObject()
  settings: {
    [key: string]: {
      isSingleChoice: boolean;
      options: string[];
    };
  };
}
