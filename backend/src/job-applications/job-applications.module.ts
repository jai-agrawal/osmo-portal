import { Module } from '@nestjs/common';
import { JobApplicationsService } from './job-applications.service';
import { JobApplicationsController } from './job-applications.controller';
import { JobApplication } from './schema/job-application.schema';
import { JobApplicationSchema } from './schema/job-application.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JobsService } from 'src/jobs/jobs.service';
// import { JobsModule } from 'src/jobs/jobs.module';
import { Job } from 'src/jobs/schema/job.schema';
import { JobSchema } from 'src/jobs/schema/job.schema';
import { ClientsService } from 'src/clients/clients.service';
import CandidatesService from 'src/candidates/candidates.service';
import { MailerService } from 'src/mailer/mailer.service';
import { Client } from 'src/clients/schema/client.schema';
import { ClientSchema } from 'src/clients/schema/client.schema';
import { Candidate } from 'src/candidates/schema/candidate.schema';
import { CandidateSchema } from 'src/candidates/schema/candidate.schema';
import { Recruiter } from 'src/recruiters/schema/recruiter.schema';
import { RecruiterSchema } from 'src/recruiters/schema/recruiter.schema';
import { Settings, SettingsSchema } from 'src/settings/schema/settings.schema';
import { EmailQueueModule } from 'src/email-queue/email-queue.module';
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
  controllers: [JobApplicationsController],
  providers: [
    MailerService,
    JobApplicationsService,
    JobsService,
    CandidatesService,
    ClientsService,
  ],
})
export class JobApplicationsModule {}
