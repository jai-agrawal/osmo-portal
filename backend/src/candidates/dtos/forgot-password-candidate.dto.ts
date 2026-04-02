import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordCandidateDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;
}
