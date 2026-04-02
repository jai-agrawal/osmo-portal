import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RecruitersService } from 'src/recruiters/recruiters.service';
import { RecruiterLoginDto } from './dtos/login.dto';
import { Recruiter } from 'src/recruiters/schema/recruiter.schema';
import { ForgotPasswordDto } from 'src/recruiters/dtos/forgot-password.dto';
import { comparePassword, generatePassword } from 'src/common/utils/password';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { getResetPasswordToken } from 'src/common/utils/token';
import { MailerService } from 'src/mailer/mailer.service';
import { EmailQueueService } from 'src/email-queue/email-queue.service';
import { EmailPriority } from 'src/email-queue/schema/email-queue.schema';

@Injectable()
export class RecruiterAuthService {
  constructor(
    private readonly recruiterService: RecruitersService,
    private readonly jwtService: JwtService,
    private readonly logger: Logger,
    private readonly mailerService: MailerService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  /**
   * Validate a recruiter
   * @param email - The email of the recruiter to validate
   * @param password - The password of the recruiter to validate
   * @returns The recruiter or null if not found or password is invalid
   */
  async validateRecruiter(
    email: string,
    password: string,
  ): Promise<Recruiter | null> {
    const recruiter = await this.recruiterService.findByEmail(email, true);
    if (!recruiter) {
      return null;
    }
    const isPasswordValid = await comparePassword(password, recruiter.password);
    if (!isPasswordValid) {
      return null;
    }
    return recruiter;
  }

  /**
   * Login a recruiter
   * @param loginDto - The data to login the recruiter with
   * @returns The access token
   */
  async login(loginDto: RecruiterLoginDto) {
    const { email, password } = loginDto;
    const recruiter = await this.validateRecruiter(email, password);
    if (!recruiter) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = {
      id: recruiter._id,
      email: recruiter.email,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const user = await this.recruiterService.findOneByCondition({
      _id: recruiter._id,
    });
    return { accessToken, user };
  }

  /**
   * Forgot password
   * @param forgotPasswordDto - The data to forgot password
   * @returns The reset password token
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const recruiter = await this.recruiterService.findByEmail(email);
    if (!recruiter) {
      this.logger.error(`Recruiter not found: ${email}`);
      throw new NotFoundException('Recruiter not found');
    }

    const resetPasswordToken = getResetPasswordToken();
    recruiter.resetPasswordToken = resetPasswordToken;
    recruiter.resetPasswordTokenExpires = new Date(
      Date.now() + 3600000, // 1 hour
    );
    await recruiter.save();

    // Send reset password email (HIGH priority - bypasses queue)
    const html = await this.mailerService.renderResetPasswordHtml(
      resetPasswordToken,
      false,
      recruiter.name,
    );
    await this.emailQueueService.enqueueEmail({
      to: email,
      subject: 'Your Osmo Password Reset Confirmation',
      html,
      priority: EmailPriority.HIGH,
      templateName: 'reset-password',
      metadata: { recruiterName: recruiter.name },
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
   * @returns The updated recruiter
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { resetPasswordToken, newPassword } = resetPasswordDto;

    const recruiter = await this.recruiterService.findOneByCondition({
      resetPasswordToken,
      resetPasswordTokenExpires: { $gt: new Date() }, // Check if the token is not expired
    });

    if (!recruiter) {
      throw new BadRequestException('Invalid or expired reset password token');
    }

    console.log(newPassword);
    // recruiter.password = newPassword;
    recruiter.password = await generatePassword(newPassword);
    // recruiter.resetPasswordToken = undefined;
    // recruiter.resetPasswordTokenExpires = undefined;
    await recruiter.save();

    return {
      message: 'Password reset successful',
    };
  }
}
