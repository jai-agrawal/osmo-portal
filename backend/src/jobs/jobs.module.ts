import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from './schema/job.schema';
import { JobApplication } from 'src/job-applications/schema/job-application.schema';
import { RecruiterSchema } from 'src/recruiters/schema/recruiter.schema';
import { CandidateSchema } from 'src/candidates/schema/candidate.schema';
import { ClientSchema } from 'src/clients/schema/client.schema';
import { Client } from 'src/clients/schema/client.schema';
import { Candidate } from 'src/candidates/schema/candidate.schema';
import { Recruiter } from 'src/recruiters/schema/recruiter.schema';
import { JobApplicationSchema } from 'src/job-applications/schema/job-application.schema';
import { MailerService } from 'src/mailer/mailer.service';
import { EmailQueueModule } from 'src/email-queue/email-queue.module';
import { Settings, SettingsSchema } from 'src/settings/schema/settings.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobApplication.name, schema: JobApplicationSchema },
      { name: Job.name, schema: JobSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: Recruiter.name, schema: RecruiterSchema },
      { name: Settings.name, schema: SettingsSchema },
    ]),
    EmailQueueModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, MailerService],
  exports: [JobsService],
})
export class JobsModule {}
