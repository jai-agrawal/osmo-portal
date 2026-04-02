import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CandidateAuthService } from './candidate-auth.service';
import { CandidateLoginDto } from './dtos/login.dto';
import { ForgotPasswordCandidateDto } from 'src/candidates/dtos/forgot-password-candidate.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { VerifyDto } from './dtos/verify-token.dto';

@Controller('auth/candidate')
export class CandidateAuthController {
  constructor(private readonly candidateAuthService: CandidateAuthService) {}

  /**
   * Login
   * @param loginDto - The data to login
   * @returns The access token
   */
  @Post('login')
  login(@Body() loginDto: CandidateLoginDto) {
    return this.candidateAuthService.login(loginDto);
  }

  /**
   * Forgot password
   * @param forgotPasswordDto - The data to forgot password
   * @returns The updated candidate
   */
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordCandidateDto) {
    return this.candidateAuthService.forgotPassword(forgotPasswordDto);
  }

  /**
   * Reset password
   * @param resetPasswordDto - The data to reset password
   * @returns The updated candidate
   */
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.candidateAuthService.resetPassword(resetPasswordDto);
  }

  @Post('verify')
  verifyUser(@Body() verifyDto: VerifyDto) {
    return this.candidateAuthService.verifyUser(verifyDto);
  }

  /**
   * Google OAuth
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    try {
      const result = await this.candidateAuthService.socialLogin(req.user);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(
        `${frontendUrl}/auth-callback?token=${result.accessToken}&userId=${result.user._id}`,
      );
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/sign-in?error=google_auth_failed`);
    }
  }
}
