import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { MailerModule } from 'src/mailer/mailer.module';
import { EmailQueueModule } from 'src/email-queue/email-queue.module';
import {
  Candidate,
  CandidateSchema,
} from 'src/candidates/schema/candidate.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from 'src/jobs/schema/job.schema';

@Module({
  imports: [
    MailerModule,
    MongooseModule.forFeature([
      { name: Candidate.name, schema: CandidateSchema },
      { name: Job.name, schema: JobSchema },
    ]),
    EmailQueueModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
