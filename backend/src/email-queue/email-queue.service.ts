import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import {
  EmailQueue,
  EmailPriority,
  EmailStatus,
} from './schema/email-queue.schema';
import { EmailQueueSettings } from './schema/email-queue-settings.schema';
import { MailerService } from 'src/mailer/mailer.service';

const MAX_RETRIES = 3;
const MEDIUM_BATCH_SIZE = parseInt(process.env.EMAIL_MEDIUM_BATCH_SIZE || '10');
const LOW_BATCH_SIZE = parseInt(process.env.EMAIL_LOW_BATCH_SIZE || '25');

export interface EnqueueEmailDto {
  to: string;
  subject: string;
  html: string;
  priority: EmailPriority;
  templateName?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  campaignId?: string;
}

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);
  private isProcessingMedium = false;
  private isProcessingLow = false;

  constructor(
    @InjectModel(EmailQueue.name)
    private readonly emailQueueModel: Model<EmailQueue>,
    @InjectModel(EmailQueueSettings.name)
    private readonly settingsModel: Model<EmailQueueSettings>,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Enqueue an email.
   * HIGH priority: sends immediately and logs as SENT.
   * MEDIUM/LOW priority: inserts as PENDING for batch processing.
   */
  async enqueueEmail(dto: EnqueueEmailDto): Promise<EmailQueue> {
    if (dto.priority === EmailPriority.HIGH) {
      // Send immediately, then log
      try {
        const headers: Record<string, string> = {};
        if (dto.tags && dto.tags.length > 0) {
          headers['X-MSG91-TAGS'] = dto.tags.join(',');
        }
        if (dto.campaignId) {
          headers['X-MSG91-CAMPAIGN-UID'] = dto.campaignId;
        }

        await this.mailerService.sendEmail(
          dto.to,
          dto.subject,
          undefined,
          dto.html,
          headers,
        );
        const emailDoc = new this.emailQueueModel({
          ...dto,
          status: EmailStatus.SENT,
          sentAt: new Date(),
        });
        return emailDoc.save();
      } catch (error) {
        this.logger.error(
          `HIGH priority email send failed to ${dto.to}: ${error.message}`,
        );
        // Still save to queue as FAILED so it can be retried
        const emailDoc = new this.emailQueueModel({
          ...dto,
          status: EmailStatus.FAILED,
          error: error.message,
        });
        return emailDoc.save();
      }
    }

    // MEDIUM/LOW: insert as PENDING
    const emailDoc = new this.emailQueueModel({
      ...dto,
      status: EmailStatus.PENDING,
    });
    return emailDoc.save();
  }

  /**
   * Bulk enqueue emails (for newsletter).
   */
  async enqueueBulk(emails: EnqueueEmailDto[]): Promise<void> {
    const docs = emails.map((dto) => ({
      ...dto,
      status: EmailStatus.PENDING,
    }));
    await this.emailQueueModel.insertMany(docs);
    this.logger.log(`Bulk enqueued ${docs.length} emails`);
  }

  /**
   * Process MEDIUM priority emails every 30 seconds.
   */
  @Cron('*/30 * * * * *')
  async processMediumPriority(): Promise<void> {
    if (this.isProcessingMedium || (await this.isQueuePaused())) return;
    this.isProcessingMedium = true;
    try {
      await this.processBatch(EmailPriority.MEDIUM, MEDIUM_BATCH_SIZE);
    } finally {
      this.isProcessingMedium = false;
    }
  }

  /**
   * Process LOW priority emails every 60 seconds.
   */
  @Cron('0 * * * * *')
  async processLowPriority(): Promise<void> {
    if (this.isProcessingLow || (await this.isQueuePaused())) return;
    this.isProcessingLow = true;
    try {
      await this.processBatch(EmailPriority.LOW, LOW_BATCH_SIZE);
    } finally {
      this.isProcessingLow = false;
    }
  }

  /**
   * Pick and process a batch of pending emails.
   */
  private async processBatch(
    priority: EmailPriority,
    batchSize: number,
  ): Promise<void> {
    const emails = await this.emailQueueModel
      .find({
        status: EmailStatus.PENDING,
        priority,
      })
      .sort({ createdAt: 1 })
      .limit(batchSize);

    if (emails.length === 0) return;

    this.logger.log(`Processing ${emails.length} ${priority} priority emails`);

    for (const email of emails) {
      await this.sendAndUpdate(email);
    }
  }

  /**
   * Send a single email and update its status.
   */
  private async sendAndUpdate(emailDoc: EmailQueue): Promise<void> {
    try {
      // Mark as processing
      emailDoc.status = EmailStatus.PROCESSING;
      await emailDoc.save();

      const headers: Record<string, string> = {};
      if (emailDoc.tags && emailDoc.tags.length > 0) {
        headers['X-MSG91-TAGS'] = emailDoc.tags.join(',');
      }
      if (emailDoc.campaignId) {
        headers['X-MSG91-CAMPAIGN-UID'] = emailDoc.campaignId;
      }

      await this.mailerService.sendEmail(
        emailDoc.to,
        emailDoc.subject,
        undefined,
        emailDoc.html,
        headers,
      );

      emailDoc.status = EmailStatus.SENT;
      emailDoc.sentAt = new Date();
      emailDoc.error = '';
      await emailDoc.save();
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${emailDoc.to}: ${error.message}`,
      );
      emailDoc.retryCount += 1;
      emailDoc.error = error.message;

      if (emailDoc.retryCount >= MAX_RETRIES) {
        emailDoc.status = EmailStatus.FAILED;
      } else {
        emailDoc.status = EmailStatus.PENDING; // Will be retried in next batch
      }
      await emailDoc.save();
    }
  }

  /**
   * Get a single email by ID.
   */
  async getEmailById(id: string): Promise<EmailQueue> {
    const emailDoc = await this.emailQueueModel.findById(id);
    if (!emailDoc) {
      throw new Error('Email queue item not found');
    }
    return emailDoc;
  }

  /**
   * Retry a single failed email.
   */
  async retryFailed(id: string): Promise<EmailQueue> {
    const emailDoc = await this.emailQueueModel.findById(id);
    if (!emailDoc) {
      throw new Error('Email queue item not found');
    }
    if (emailDoc.status !== EmailStatus.FAILED) {
      throw new Error('Only FAILED emails can be retried');
    }
    emailDoc.status = EmailStatus.PENDING;
    emailDoc.retryCount = 0;
    emailDoc.error = '';
    return emailDoc.save();
  }

  /**
   * Retry all failed emails.
   */
  async retryAllFailed(): Promise<{ modifiedCount: number }> {
    const result = await this.emailQueueModel.updateMany(
      { status: EmailStatus.FAILED },
      {
        $set: {
          status: EmailStatus.PENDING,
          retryCount: 0,
          error: '',
        },
      },
    );
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Toggle the queue pause state.
   */
  async toggleQueuePause(paused: boolean): Promise<EmailQueueSettings> {
    let settings = await this.settingsModel.findOne();
    if (!settings) {
      settings = new this.settingsModel();
    }
    settings.isPaused = paused;
    return settings.save();
  }

  /**
   * Check if the queue is paused.
   */
  async isQueuePaused(): Promise<boolean> {
    const settings = await this.settingsModel.findOne();
    return settings ? settings.isPaused : false;
  }

  /**
   * Get queue statistics.
   */
  async getQueueStats(): Promise<Record<string, any>> {
    const [statusCounts, priorityCounts] = await Promise.all([
      this.emailQueueModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.emailQueueModel.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
    ]);

    const stats = {
      total: 0,
      byStatus: {
        [EmailStatus.PENDING]: 0,
        [EmailStatus.PROCESSING]: 0,
        [EmailStatus.SENT]: 0,
        [EmailStatus.FAILED]: 0,
      },
      byPriority: {
        [EmailPriority.HIGH]: 0,
        [EmailPriority.MEDIUM]: 0,
        [EmailPriority.LOW]: 0,
      },
    };

    for (const item of statusCounts) {
      stats.byStatus[item._id] = item.count;
      stats.total += item.count;
    }
    for (const item of priorityCounts) {
      stats.byPriority[item._id] = item.count;
    }

    stats['isPaused'] = await this.isQueuePaused();

    return stats;
  }

  /**
   * Get paginated queue items with filters.
   */
  async getQueueItems(query: {
    page?: number;
    pageSize?: number;
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<{ data: EmailQueue[]; meta: any }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const findConditions: any = {};

    if (query.status) {
      findConditions.status = { $in: query.status.split(',') };
    }
    if (query.priority) {
      findConditions.priority = { $in: query.priority.split(',') };
    }
    if (query.search) {
      findConditions.$or = [
        { to: { $regex: query.search, $options: 'i' } },
        { subject: { $regex: query.search, $options: 'i' } },
        { templateName: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.emailQueueModel
        .find(findConditions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .select('-html') // Exclude html body from list
        .lean(),
      this.emailQueueModel.countDocuments(findConditions),
    ]);

    return {
      data: data as EmailQueue[],
      meta: {
        total,
        page,
        limit: pageSize,
        pages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Clear the queue based on filters.
   */
  async clearQueue(query: {
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<{ deletedCount: number }> {
    const findConditions: any = {};

    if (query.status) {
      findConditions.status = { $in: query.status.split(',') };
    }
    if (query.priority) {
      findConditions.priority = { $in: query.priority.split(',') };
    }
    if (query.search) {
      findConditions.$or = [
        { to: { $regex: query.search, $options: 'i' } },
        { subject: { $regex: query.search, $options: 'i' } },
        { templateName: { $regex: query.search, $options: 'i' } },
      ];
    }

    const result = await this.emailQueueModel.deleteMany(findConditions);
    this.logger.log(
      `Cleared ${result.deletedCount} emails from queue with filters: ${JSON.stringify(
        query,
      )}`,
    );
    return { deletedCount: result.deletedCount };
  }
}
