import { JwtModule } from '@nestjs/jwt';
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { RecruiterJwtStrategy } from './recruiter-jwt.strategy';
import { RecruiterAuthService } from './recruiter-auth.service';
import { RecruiterAuthController } from './recruiter-auth.controller';
import { PassportModule } from '@nestjs/passport';
import { RecruiterSchema } from 'src/recruiters/schema/recruiter.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Recruiter } from 'src/recruiters/schema/recruiter.schema';
import { RecruitersModule } from 'src/recruiters/recruiters.module';
import { MailerService } from 'src/mailer/mailer.service';
import { EmailQueueModule } from 'src/email-queue/email-queue.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Recruiter.name, schema: RecruiterSchema },
    ]),
    RecruitersModule,
    EmailQueueModule,
  ],
  providers: [
    RecruiterAuthService,
    RecruiterJwtStrategy,
    Logger,
    MailerService,
  ],
  controllers: [RecruiterAuthController],
})
export class RecruiterAuthModule {}
