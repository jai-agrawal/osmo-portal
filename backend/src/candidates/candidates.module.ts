import { MongooseModule } from '@nestjs/mongoose';
import { Logger, Module } from '@nestjs/common';
import { CandidateSchema } from './schema/candidate.schema';
import CandidatesService from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { Candidate } from './schema/candidate.schema';
import { MailerService } from 'src/mailer/mailer.service';
import {
  JobApplicationSchema,
  JobApplication,
} from 'src/job-applications/schema/job-application.schema';
import { EmailQueueModule } from 'src/email-queue/email-queue.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Candidate.name, schema: CandidateSchema },
      { name: JobApplication.name, schema: JobApplicationSchema },
    ]),
    EmailQueueModule,
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService, MailerService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
