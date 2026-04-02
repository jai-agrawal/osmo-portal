import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum EmailPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum EmailStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class EmailQueue extends Document {
  @Prop({ required: true })
  to: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  html: string;

  @Prop({
    type: String,
    enum: EmailPriority,
    default: EmailPriority.MEDIUM,
    index: true,
  })
  priority: EmailPriority;

  @Prop({
    type: String,
    enum: EmailStatus,
    default: EmailStatus.PENDING,
    index: true,
  })
  status: EmailStatus;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop({ default: '' })
  error: string;

  @Prop({ default: '' })
  templateName: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop()
  sentAt: Date;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: '' })
  campaignId: string;

  createdAt: Date;
  updatedAt: Date;
}

export const EmailQueueSchema = SchemaFactory.createForClass(EmailQueue);

// Compound index for efficient queue polling: pick PENDING emails by priority, oldest first
EmailQueueSchema.index({ status: 1, priority: 1, createdAt: 1 });

// TTL index: delete documents after 30 days (2592000 seconds)
EmailQueueSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
