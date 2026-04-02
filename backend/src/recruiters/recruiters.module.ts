import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Recruiter, RecruiterSchema } from './schema/recruiter.schema';
import { RecruitersController } from './recruiters.controller';
import { RecruitersService } from './recruiters.service';
import { MailerService } from 'src/mailer/mailer.service';
import {
  Candidate,
  CandidateSchema,
} from 'src/candidates/schema/candidate.schema';
import {
  JobApplication,
  JobApplicationSchema,
} from 'src/job-applications/schema/job-application.schema';
import { EmailQueueModule } from 'src/email-queue/email-queue.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recruiter.name, schema: RecruiterSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: JobApplication.name, schema: JobApplicationSchema },
    ]),
    EmailQueueModule,
  ],
  controllers: [RecruitersController],
  providers: [RecruitersService, MailerService],
  exports: [RecruitersService],
})
export class RecruitersModule {}
