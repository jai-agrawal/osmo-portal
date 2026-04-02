import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { RecruiterAuthService } from './recruiter-auth.service';
import { RecruiterLoginDto } from './dtos/login.dto';
import { ForgotPasswordDto } from 'src/recruiters/dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth/recruiter')
export class RecruiterAuthController {
  constructor(private readonly recruiterAuthService: RecruiterAuthService) {}

  @Post('login')
  login(@Body() loginDto: RecruiterLoginDto) {
    return this.recruiterAuthService.login(loginDto);
  }

  @Post('forgot-password')
  // @UseGuards(AuthGuard('recruiter-jwt'))
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.recruiterAuthService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  // @UseGuards(AuthGuard('recruiter-jwt'))
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.recruiterAuthService.resetPassword(resetPasswordDto);
  }
}
