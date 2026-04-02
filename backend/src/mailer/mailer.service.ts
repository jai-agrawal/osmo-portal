import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as ejs from 'ejs';
import * as mjml from 'mjml';
@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    text?: string,
    html?: string,
    headers?: Record<string, string>,
  ) {
    await this.transporter.sendMail({
      from: 'Team OSMO <support@jobsosmo.in>',
      to,
      subject,
      text,
      html,
      headers,
    });
  }

  private stripHtmlTags(html: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .trim();
  }

  async getHtmlFromMjml(templateName: string, data: any) {
    const mjmlTemplate = await fs.promises.readFile(
      path.join(__dirname, 'email-templates', templateName, 'index.mjml'),
      'utf8',
    );
    const renderedMjml = ejs.render(mjmlTemplate, {
      ...data,
      stripHtml: (html: string) => this.stripHtmlTags(html),
    });
    const { html, errors } = mjml(renderedMjml, {
      // Optional MJML configuration options
      // validationLevel: 'strict' // 'strict', 'soft', 'skip'
      // filePath: templatePath // Helps resolve includes if you use them
    });
    if (errors.length > 0) {
      throw new Error(errors.map((error) => error.message).join('\n'));
    }
    return html;
  }

  async sendResetPasswordEmail(
    toEmail: string,
    resetToken: string,
    isFrontend: boolean = false,
    userName: string = '',
  ) {
    const frontendUrl =
      process.env.JOB_SEEKER_URL + '/reset-password?resetToken=' + resetToken;
    const backendUrl =
      process.env.UI_URL + '/auth/reset-password?resetToken=' + resetToken;
    const resetPasswordUrl = isFrontend ? frontendUrl : backendUrl;

    const html = await this.getHtmlFromMjml('reset-password', {
      userName,
      year: new Date().getFullYear(),
      resetPasswordUrl,
    });

    const mailOptions = {
      from: 'Team OSMO <support@jobsosmo.in>',
      to: toEmail,
      subject: 'Your Osmo Password Reset Confirmation',
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendVerificationEmailOnSignUp(
    toEmail: string,
    verifyToken: string,
    isFrontend: boolean = false,
    userName: string = '',
  ) {
    const frontendUrl =
      process.env.JOB_SEEKER_URL + '/verify-user?verifyToken=' + verifyToken;
    const backendUrl =
      process.env.UI_URL + '/auth/verify-user?verifyToken=' + verifyToken;
    const verifyEmailUrl = isFrontend ? frontendUrl : backendUrl;
    const templateName = isFrontend ? 'verify-user' : 'verify-user-backend';
    const html = await this.getHtmlFromMjml(templateName, {
      userName,
      year: new Date().getFullYear(),
      verifyEmailUrl,
    });

    const mailOptions = {
      from: 'Team OSMO <support@jobsosmo.in>',
      to: toEmail,
      subject: 'Osmo: Verify your account',
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordEmailOnSignUp(
    toEmail: string,
    password: string,
    isFrontend: boolean = false,
    resetPasswordToken: string = '',
    verifyToken: string = '',
  ) {
    const url = isFrontend ? process.env.JOB_SEEKER_URL : process.env.UI_URL;
    let templateName = isFrontend ? 'set-password' : 'set-password-backend';

    const resetPasswordUrl =
      process.env.JOB_SEEKER_URL +
      '/reset-password?resetToken=' +
      resetPasswordToken;

    if (isFrontend && resetPasswordToken) {
      templateName = 'set-password-backend';
    }

    const verifyEmailUrl = isFrontend
      ? process.env.JOB_SEEKER_URL + '/verify-user?verifyToken=' + verifyToken
      : process.env.UI_URL + '/auth/verify-user?verifyToken=' + verifyToken;

    const html = await this.getHtmlFromMjml(templateName, {
      userName: '',
      email: toEmail,
      password,
      year: new Date().getFullYear(),
      url,
      resetPasswordUrl,
      verifyEmailUrl,
    });

    const mailOptions = {
      from: 'Team OSMO <support@jobsosmo.in>',
      to: toEmail,
      subject: 'Welcome to Osmo',
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendJobReopeningEmail(emails) {
    for (const email of emails) {
      const html = await this.getHtmlFromMjml('reopen-job', {
        userName: email.userName,
        candidateEmail: email.candidateEmail,
        recruiterEmail: email.recruiterEmail,
        jobName: email.jobName,
        companyName: email.companyName,
        year: new Date().getFullYear(),
      });

      const mailOptions = {
        from: 'Team OSMO <support@jobsosmo.in>',
        to: email.candidateEmail,
        subject: `The ${email.jobName} Role at ${email.companyName} is Open Again`,
        html,
      };
      await this.transporter.sendMail(mailOptions);
    }
  }

  async sendApplicationRejectedEmail(
    toEmail: string,
    jobName: string,
    candidateName: string,
    clientName: string,
  ) {
    const html = await this.getHtmlFromMjml('application-rejected', {
      userName: candidateName,
      jobName,
      year: new Date().getFullYear(),
      clientName,
    });

    const mailOptions = {
      from: 'Team OSMO <support@jobsosmo.in>',
      to: toEmail,
      subject: `${clientName}: ${jobName} Application Status`,
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendApplicationNotSelectedEmail(
    toEmail: string,
    jobName: string,
    candidateName: string,
    clientName: string,
  ) {
    const html = await this.getHtmlFromMjml('not-selected', {
      userName: candidateName,
      jobName,
      clientName,
      year: new Date().getFullYear(),
    });

    const mailOptions = {
      from: 'Team OSMO <support@jobsosmo.in>',
      to: toEmail,
      subject: `${clientName}: ${jobName} Application Status`,
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendApplicationHiredEmail(
    toEmail: string,
    jobName: string,
    candidateName: string,
    clientName: string,
  ) {
    const html = await this.getHtmlFromMjml('hired', {
      userName: candidateName,
      jobName,
      clientName,
      year: new Date().getFullYear(),
    });

    const mailOptions = {
      from: 'Team OSMO <support@jobsosmo.in>',
      to: toEmail,
      subject: `Congratulations! Your New Role as ${jobName}`,
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendApplicationReceivedEmail(
    toEmail: string,
    jobName: string,
    candidateName: string,
    recruiterEmail: string,
  ) {
    const html = await this.getHtmlFromMjml('application-received', {
      userName: candidateName,
      jobName,
      year: new Date().getFullYear(),
      recruiterEmail,
    });

    const mailOptions = {
      from: 'Team OSMO <support@jobsosmo.in>',
      to: toEmail,
      subject: `Job Application Received - ${jobName}`,
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendRecommendedJobsEmail({
    email,
    jobs,
    userName,
  }: {
    email: string;
    jobs: any[];
    userName: string;
  }) {
    const html = await this.getHtmlFromMjml('recommended-newsletter', {
      userName,
      jobs,
      year: new Date().getFullYear(),
    });

    const mailOptions = {
      from: 'Team OSMO <support@jobsosmo.in>',
      to: email,
      subject: 'Recommended Jobs',
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }

  // ---- Render-only methods (return HTML without sending) ----

  async renderResetPasswordHtml(
    resetToken: string,
    isFrontend: boolean = false,
    userName: string = '',
  ): Promise<string> {
    const frontendUrl =
      process.env.JOB_SEEKER_URL + '/reset-password?resetToken=' + resetToken;
    const backendUrl =
      process.env.UI_URL + '/auth/reset-password?resetToken=' + resetToken;
    const resetPasswordUrl = isFrontend ? frontendUrl : backendUrl;

    return this.getHtmlFromMjml('reset-password', {
      userName,
      year: new Date().getFullYear(),
      resetPasswordUrl,
    });
  }

  async renderVerificationEmailHtml(
    verifyToken: string,
    isFrontend: boolean = false,
    userName: string = '',
  ): Promise<string> {
    const frontendUrl =
      process.env.JOB_SEEKER_URL + '/verify-user?verifyToken=' + verifyToken;
    const backendUrl =
      process.env.UI_URL + '/auth/verify-user?verifyToken=' + verifyToken;
    const verifyEmailUrl = isFrontend ? frontendUrl : backendUrl;
    const templateName = isFrontend ? 'verify-user' : 'verify-user-backend';
    return this.getHtmlFromMjml(templateName, {
      userName,
      year: new Date().getFullYear(),
      verifyEmailUrl,
    });
  }

  async renderPasswordEmailOnSignUpHtml(
    toEmail: string,
    password: string,
    isFrontend: boolean = false,
    resetPasswordToken: string = '',
    verifyToken: string = '',
  ): Promise<string> {
    const url = isFrontend ? process.env.JOB_SEEKER_URL : process.env.UI_URL;
    let templateName = isFrontend ? 'set-password' : 'set-password-backend';

    const resetPasswordUrl =
      process.env.JOB_SEEKER_URL +
      '/reset-password?resetToken=' +
      resetPasswordToken;

    if (isFrontend && resetPasswordToken) {
      templateName = 'set-password-backend';
    }

    const verifyEmailUrl = isFrontend
      ? process.env.JOB_SEEKER_URL + '/verify-user?verifyToken=' + verifyToken
      : process.env.UI_URL + '/auth/verify-user?verifyToken=' + verifyToken;

    return this.getHtmlFromMjml(templateName, {
      userName: '',
      email: toEmail,
      password,
      year: new Date().getFullYear(),
      url,
      resetPasswordUrl,
      verifyEmailUrl,
    });
  }

  async renderJobReopeningHtml(emailData: {
    userName: string;
    candidateEmail: string;
    recruiterEmail: string;
    jobName: string;
    companyName: string;
  }): Promise<string> {
    return this.getHtmlFromMjml('reopen-job', {
      userName: emailData.userName,
      candidateEmail: emailData.candidateEmail,
      recruiterEmail: emailData.recruiterEmail,
      jobName: emailData.jobName,
      companyName: emailData.companyName,
      year: new Date().getFullYear(),
    });
  }

  async renderApplicationRejectedHtml(
    candidateName: string,
    jobName: string,
    clientName: string,
  ): Promise<string> {
    return this.getHtmlFromMjml('application-rejected', {
      userName: candidateName,
      jobName,
      year: new Date().getFullYear(),
      clientName,
    });
  }

  async renderApplicationNotSelectedHtml(
    candidateName: string,
    jobName: string,
    clientName: string,
  ): Promise<string> {
    return this.getHtmlFromMjml('not-selected', {
      userName: candidateName,
      jobName,
      clientName,
      year: new Date().getFullYear(),
    });
  }

  async renderApplicationHiredHtml(
    candidateName: string,
    jobName: string,
    clientName: string,
  ): Promise<string> {
    return this.getHtmlFromMjml('hired', {
      userName: candidateName,
      jobName,
      clientName,
      year: new Date().getFullYear(),
    });
  }

  async renderApplicationReceivedHtml(
    candidateName: string,
    jobName: string,
    recruiterEmail: string,
  ): Promise<string> {
    return this.getHtmlFromMjml('application-received', {
      userName: candidateName,
      jobName,
      year: new Date().getFullYear(),
      recruiterEmail,
    });
  }

  async renderRecommendedJobsHtml({
    userName,
    jobs,
  }: {
    userName: string;
    jobs: any[];
  }): Promise<string> {
    return this.getHtmlFromMjml('recommended-newsletter', {
      userName,
      jobs,
      year: new Date().getFullYear(),
    });
  }
}
