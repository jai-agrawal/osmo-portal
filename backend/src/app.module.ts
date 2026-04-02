import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RecruitersModule } from './recruiters/recruiters.module';
import { RecruiterAuthModule } from './auth/recruiter/recruiter-auth.module';
import { MailerService } from './mailer/mailer.service';
import { MailerModule } from './mailer/mailer.module';
import { SettingsModule } from './settings/settings.module';
import { JobsModule } from './jobs/jobs.module';
import { ClientsModule } from './clients/clients.module';
import { CandidateAuthModule } from './auth/candidate/candidate-auth.module';
import { CandidatesModule } from './candidates/candidates.module';
import { FilesModule } from './files/files.module';
import { S3Service } from './common/services/s3.service';
import { JobApplicationsModule } from './job-applications/job-applications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './tasks/tasks.module';
import { EmailQueueModule } from './email-queue/email-queue.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const options: MongooseModuleOptions = {
          uri: configService.get<string>('DATABASE_URL'),
          serverSelectionTimeoutMS: 30000, // 30 seconds
          socketTimeoutMS: 45000, // 45 seconds
          connectTimeoutMS: 30000, // 30 seconds
          maxPoolSize: 10, // Maintain up to 10 socket connections
          minPoolSize: 5, // Maintain a minimum of 5 socket connections
          maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
          bufferCommands: false, // Disable mongoose buffering
        };
        return options;
      },
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    MailerModule,
    FilesModule,
    RecruitersModule,
    RecruiterAuthModule,
    CandidatesModule,
    CandidateAuthModule,
    ClientsModule,
    JobsModule,
    SettingsModule,
    JobApplicationsModule,
    TasksModule,
    EmailQueueModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: Logger,
      useFactory: () => new Logger('Recruiter API'),
    },
    MailerService,
    S3Service,
  ],
  exports: [Logger],
})
export class AppModule {}
