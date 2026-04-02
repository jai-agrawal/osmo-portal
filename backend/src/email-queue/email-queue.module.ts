import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailQueue, EmailQueueSchema } from './schema/email-queue.schema';
import {
  EmailQueueSettings,
  EmailQueueSettingsSchema,
} from './schema/email-queue-settings.schema';
import { EmailQueueService } from './email-queue.service';
import { EmailQueueController } from './email-queue.controller';
import { MailerModule } from 'src/mailer/mailer.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailQueue.name, schema: EmailQueueSchema },
      { name: EmailQueueSettings.name, schema: EmailQueueSettingsSchema },
    ]),
    MailerModule,
  ],
  controllers: [EmailQueueController],
  providers: [EmailQueueService],
  exports: [EmailQueueService],
})
export class EmailQueueModule {}
