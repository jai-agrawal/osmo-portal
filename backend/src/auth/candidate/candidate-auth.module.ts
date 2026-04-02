import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CandidateAuthController } from './candidate-auth.controller';
import { CandidateAuthService } from './candidate-auth.service';
import { CandidateJwtStrategy } from './candidate-jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { MailerService } from 'src/mailer/mailer.service';
import { Candidate } from 'src/candidates/schema/candidate.schema';
import { CandidateSchema } from 'src/candidates/schema/candidate.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { CandidatesModule } from 'src/candidates/candidates.module';
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
      { name: Candidate.name, schema: CandidateSchema },
    ]),
    CandidatesModule,
    EmailQueueModule,
  ],
  providers: [
    CandidateAuthService,
    CandidateJwtStrategy,
    GoogleStrategy,
    Logger,
    MailerService,
  ],
  controllers: [CandidateAuthController],
})
export class CandidateAuthModule {}
