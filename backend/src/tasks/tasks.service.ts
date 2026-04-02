// tasks/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CandidateModel } from 'src/candidates/schema/candidate.schema';
import { JobModel } from 'src/jobs/schema/job.schema';
import { MailerService } from 'src/mailer/mailer.service';
import { EmailQueueService } from 'src/email-queue/email-queue.service';
import { EmailPriority } from 'src/email-queue/schema/email-queue.schema';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly mailService: MailerService,
    private readonly emailQueueService: EmailQueueService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  // Example: Run every Monday at 09:00 server time
  // Cron expression: '0 9 * * 1' -> minute hour day month weekday
  // If you want midnight Monday use '0 0 * * 1'.
  @Cron('0 17 * * 1')
  // @Cron('*/1 * * * *')
  async handleRecommendedJobsEmail() {
    this.logger.log('Running recommended jobs email job');
    try {
      // Check database connection before proceeding
      if (this.connection.readyState !== 1) {
        this.logger.warn('Database not connected, skipping job');
        return;
      }
      this.logger.log('Database connection is ready, proceeding with job');

      const candidates = await CandidateModel.find({
        status: 'ACTIVE',
        email: { $exists: true, $ne: '' },
        // email: 'sesankar11@gmail.com',
      }).lean();

      this.logger.log(`Found ${candidates.length} candidates`);

      const emailsToEnqueue = [];
      for (const candidate of candidates) {
        if (candidate.email) {
          const areaOfExpertise = candidate.areaOfExpertise;
          const jobs = await JobModel.find({
            status: 'ACTIVE',
            roleTypes: { $in: areaOfExpertise },
          })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

          const html = await this.mailService.renderRecommendedJobsHtml({
            userName: candidate.name,
            jobs,
          });
          emailsToEnqueue.push({
            to: candidate.email,
            subject: 'Recommended Jobs',
            html,
            priority: EmailPriority.LOW,
            templateName: 'recommended-newsletter',
            metadata: { candidateName: candidate.name },
            tags: ['newsletter'],
          });
        }
      }

      if (emailsToEnqueue.length > 0) {
        await this.emailQueueService.enqueueBulk(emailsToEnqueue);
      }

      this.logger.log(
        `Enqueued ${emailsToEnqueue.length} recommended jobs emails`,
      );
    } catch (err) {
      this.logger.error('Recommended jobs email job failed', err);
      // Optionally implement retry logic here
    }
  }

  // @Cron('*/1 * * * *') // every 1 minute
  // async handleTestJob() {
  //   console.log('Test job fired');
  //   this.logger.log('Test job fired');
  // }
}
