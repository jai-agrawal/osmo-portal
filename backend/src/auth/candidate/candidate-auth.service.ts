import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { MailerService } from 'src/mailer/mailer.service';
import { EmailQueueService } from 'src/email-queue/email-queue.service';
import { EmailPriority } from 'src/email-queue/schema/email-queue.schema';
import CandidatesService from 'src/candidates/candidates.service';
// import { Candidate } from 'src/candidates/interfaces/candidate.interface';
import { Candidate } from 'src/candidates/schema/candidate.schema';
import { comparePassword, generatePassword } from 'src/common/utils/password';
import { CandidateLoginDto as LoginDto } from './dtos/login.dto';
import { ForgotPasswordDto } from 'src/recruiters/dtos/forgot-password.dto';
import { getResetPasswordToken } from 'src/common/utils/token';
import { Document } from 'mongoose';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { VerifyDto } from './dtos/verify-token.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class CandidateAuthService {
  constructor(
    private readonly candidateService: CandidatesService,
    private readonly jwtService: JwtService,
    private readonly logger: Logger,
    private readonly mailerService: MailerService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  /**
   * Validate candidate
   * @param email - The email of the candidate
   * @param password - The password of the candidate
   * @returns The candidate
   */
  async validateCandidate(
    email: string,
    password: string,
  ): Promise<Candidate | null> {
    const candidate = await this.candidateService.getCandidateByEmail(
      email,
      true,
    );
    if (!candidate) {
      return null;
    }
    console.log(password, candidate.password);
    const isPasswordValid = await comparePassword(password, candidate.password);
    if (!isPasswordValid) {
      return null;
    }
    return candidate;
  }

  /**
   * Login
   * @param loginDto - The data to login
   * @returns The access token
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const candidate = await this.validateCandidate(email, password);
    if (!candidate) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // if (!candidate.isVerified) {
    //   throw new UnauthorizedException('User is not verified');
    // }
    const payload = {
      id: candidate._id,
      email: candidate.email,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    const user = await this.candidateService.getCandidateByEmail(email);
    return { accessToken, user };
  }

  /**
   * Forgot password
   * @param forgotPasswordDto - The data to forgot password
   * @returns The updated candidate
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const candidate = await this.candidateService.getCandidateByEmail(email);
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    const resetPasswordToken = getResetPasswordToken();
    candidate.resetPasswordToken = resetPasswordToken;
    candidate.resetPasswordTokenExpires = new Date(Date.now() + 3600000); // 1 hour
    await (candidate as Document & Candidate).save();

    // Send reset password email (HIGH priority - bypasses queue)
    const html = await this.mailerService.renderResetPasswordHtml(
      resetPasswordToken,
      true,
      candidate.name,
    );
    await this.emailQueueService.enqueueEmail({
      to: email,
      subject: 'Your Osmo Password Reset Confirmation',
      html,
      priority: EmailPriority.HIGH,
      templateName: 'reset-password',
      metadata: { candidateName: candidate.name },
      tags: ['otp'],
    });

    return {
      message: 'Reset password token sent',
      resetPasswordToken,
    };
  }

  /**
   * Reset password
   * @param resetPasswordDto - The data to reset password
   * @returns The updated candidate
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { resetPasswordToken, newPassword } = resetPasswordDto;

    const candidate = await this.candidateService.findOneByCondition({
      resetPasswordToken,
      resetPasswordTokenExpires: { $gt: new Date() },
    });

    if (!candidate) {
      throw new BadRequestException('Invalid or expired reset password token');
    }

    candidate.password = await generatePassword(newPassword);
    candidate.resetPasswordToken = undefined;
    candidate.resetPasswordTokenExpires = undefined;
    await (candidate as Document & Candidate).save();

    return {
      message: 'Password reset successful',
    };
  }

  async verifyUser(verifyDto: VerifyDto) {
    const { verifyToken } = verifyDto;
    const candidate = await this.candidateService.findOneByCondition({
      verifyToken,
    });
    if (!candidate) {
      throw new BadRequestException('Invalid or expired verify token');
    }
    if (candidate.isVerified) {
      throw new BadRequestException('User is already verified');
    }
    candidate.isVerified = true;
    // candidate.verifyToken = undefined;
    await (candidate as Document & Candidate).save();
    // await this.mailerService.sendPasswordEmailOnSignUp(
    //   candidate.email,
    //   candidate.password,
    //   true,
    //   candidate.verifyToken,
    // );
    return {
      message: 'User verified successfully',
    };
  }

  /**
   * Social login (Google)
   * Find or create candidate from OAuth profile, return JWT
   */
  async socialLogin(socialUser: {
    email: string;
    name: string;
    photo?: string;
  }) {
    console.log('socialLogin called with:', JSON.stringify(socialUser));

    if (!socialUser?.email) {
      throw new BadRequestException('No email received from social provider');
    }

    let candidate = await this.candidateService.getCandidateByEmail(
      socialUser.email,
    );
    console.log('Existing candidate found:', candidate ? 'yes' : 'no');

    // If candidate doesn't exist, create a new one
    if (!candidate) {
      const password = randomBytes(16).toString('hex');
      const hashedPassword = await generatePassword(password);
      console.log('Creating new social candidate for:', socialUser.email);

      candidate = await this.candidateService.createCandidateFromSocial({
        name: socialUser.name,
        email: socialUser.email,
        password: hashedPassword,
        isVerified: true,
        authProvider: 'google',
      });
      console.log('Candidate created:', candidate._id);
    }

    const payload = {
      id: candidate._id,
      email: candidate.email,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    console.log('JWT generated for candidate:', candidate._id);

    const user = await this.candidateService.getCandidateByEmail(
      socialUser.email,
    );

    return { accessToken, user };
  }
}
