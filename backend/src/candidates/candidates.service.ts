import { Model, Types } from 'mongoose';
import { CreateCandidateDto } from './dtos/create-candidate.dto';
// import { Candidate } from './interfaces/candidate.interface';
import { UpdateCandidateDto } from './dtos/update-candidate.dto';
import { Query } from '../common/interfaces/query.interface';
import { Meta } from 'src/common/interfaces/meta.interface';
import { ConflictException, Logger, Injectable } from '@nestjs/common';
import { generatePassword } from 'src/common/utils/password';
import { randomBytes } from 'crypto';
import { MailerService } from 'src/mailer/mailer.service';
import { EmailQueueService } from 'src/email-queue/email-queue.service';
import { EmailPriority } from 'src/email-queue/schema/email-queue.schema';
import { Candidate } from './schema/candidate.schema';
import { InjectModel } from '@nestjs/mongoose';
import { JobApplication } from 'src/job-applications/schema/job-application.schema';
import { getVerifyToken, getResetPasswordToken } from 'src/common/utils/token';

@Injectable()
export default class CandidatesService {
  private readonly logger = new Logger(CandidatesService.name);

  constructor(
    @InjectModel(Candidate.name)
    private readonly candidateModel: Model<Candidate>,
    @InjectModel(JobApplication.name)
    private readonly jobApplicationModel: Model<JobApplication>,
    private readonly mailerService: MailerService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  async createCandidate(
    createCandidateDto: CreateCandidateDto,
  ): Promise<Candidate> {
    const existingCandidate = await this.getCandidateByEmail(
      createCandidateDto.email,
    );
    if (existingCandidate) {
      throw new ConflictException({
        message: 'A candidate with this email already exists',
        error: 'Duplicate email',
      });
    }

    try {
      const candidate = new this.candidateModel(createCandidateDto);
      const password =
        createCandidateDto.password ||
        randomBytes(4).toString('hex').slice(0, 8);

      candidate.password = await generatePassword(password);
      candidate.verifyToken = getVerifyToken();
      const resetPasswordToken = !createCandidateDto.password
        ? getResetPasswordToken()
        : '';
      if (!createCandidateDto.password) {
        candidate.resetPasswordToken = resetPasswordToken;
        candidate.resetPasswordTokenExpires = new Date(Date.now() + 3600000); // 1 hour
      }
      const savedCandidate = await candidate.save();
      // await this.mailerService.sendVerificationEmailOnSignUp(
      //   savedCandidate.email,
      //   candidate.verifyToken,
      //   true,
      //   savedCandidate.name,
      // );
      const html = await this.mailerService.renderPasswordEmailOnSignUpHtml(
        savedCandidate.email,
        password,
        true,
        resetPasswordToken,
        candidate.verifyToken,
      );
      await this.emailQueueService.enqueueEmail({
        to: savedCandidate.email,
        subject: 'Welcome to Osmo',
        html,
        priority: EmailPriority.MEDIUM,
        templateName: 'set-password',
        metadata: { candidateName: savedCandidate.name },
        tags: ['signup-update'],
      });
      return savedCandidate;
    } catch (error) {
      this.logger.error(`Failed to create candidate: ${error.message}`);
      throw error;
    }
  }

  async updateCandidate(
    id: string,
    updateCandidateDto: UpdateCandidateDto,
  ): Promise<Candidate> {
    if (updateCandidateDto.password) {
      updateCandidateDto.password = await generatePassword(
        updateCandidateDto.password,
      );
    }
    return this.candidateModel.findByIdAndUpdate(id, updateCandidateDto, {
      new: true,
    });
  }

  async deleteCandidate(id: string): Promise<Candidate> {
    return this.candidateModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );
  }

  async getCandidate(id: string): Promise<Candidate> {
    return this.candidateModel.findById(id);
  }

  async getAllCandidates(query: Query): Promise<{
    data: Candidate[];
    meta: Meta;
  }> {
    const { page = 1, pageSize = 10 } = query;
    const skip = (page - 1) * pageSize;
    const search = query.search;
    const findConditions = {
      ...(query.filters || {}),
    };

    if (query.startDate || query.endDate) {
      findConditions.createdAt = {};
      if (query.startDate) {
        findConditions.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        findConditions.createdAt.$lte = end;
      }
    }
    if (search) {
      findConditions.$or = [{ name: { $regex: search, $options: 'i' } }];
    }
    const queryConditionsMap = {
      locationPreference: 'locationPreference',
      expectedCtc: 'expectedCtc',
      recruiterId: 'assignedToId',
      experienceLevel: 'experienceLevel',
      minExperienceLevel: 'minExperienceLevel',
      maxExperienceLevel: 'maxExperienceLevel',
      minExpectedCtc: 'minExpectedCtc',
      maxExpectedCtc: 'maxExpectedCtc',
      areaOfExpertise: 'areaOfExpertise',
    };

    for (const [key, value] of Object.entries(queryConditionsMap)) {
      if (query[key]) {
        if (key === 'recruiterId') {
          findConditions[value] = {
            $in: query[key].split(',').map((id) => new Types.ObjectId(id)),
          };
        } else if (key === 'minExperienceLevel' || key === 'minExpectedCtc') {
          findConditions[value] = { $gte: query[key] };
        } else if (key === 'maxExperienceLevel' || key === 'maxExpectedCtc') {
          findConditions[value] = { $lte: query[key] };
        } else {
          findConditions[value] = { $in: query[key].split(',') };
        }
      }
    }

    if (query.isDeleted === 'false') {
      findConditions.isDeleted = false;
    }

    if (!query.sort) {
      query.sort = { createdAt: -1 }; // Default sort by createdAt descending
    }

    const candidates = await this.candidateModel
      .find(findConditions)
      .populate({ path: 'resumeFile', select: 'url name' })
      .populate({ path: 'portfolioFile', select: 'url name' })
      .populate({ path: 'additionalFiles', select: 'url name' })
      .populate({ path: 'recruiter', select: 'name' })
      .skip(skip)
      .limit(pageSize)
      .sort(query.sort)
      .select(query.fields);

    const meta = await this.candidateModel.countDocuments(findConditions);

    return {
      data: candidates,
      meta: {
        total: meta,
        page: page,
        limit: pageSize,
        pages: Math.ceil(meta / pageSize),
      },
    };
  }

  async getCandidateByEmail(
    email: string,
    isPasswordRequired: boolean = false,
  ): Promise<Candidate> {
    return this.candidateModel
      .findOne({ email })
      .select(isPasswordRequired ? '+password' : '');
  }

  async getCandidateByMobile(mobile: string): Promise<Candidate> {
    return this.candidateModel.findOne({ mobile });
  }

  async findOneByCondition(condition: any): Promise<Candidate> {
    return this.candidateModel.findOne(condition);
  }

  async assignCandidateToRecruiter(candidateId: string, recruiterId: string) {
    const candidate = await this.candidateModel.findByIdAndUpdate(
      candidateId,
      { assignedToId: recruiterId },
      { new: true },
    );

    await this.jobApplicationModel.updateMany(
      { candidateId: candidateId },
      { assignedToId: recruiterId },
    );

    return candidate;
  }

  async saveJob(candidateId: string, jobIds: string[]) {
    return this.candidateModel.findByIdAndUpdate(candidateId, {
      savedJobIds: jobIds,
    });
  }

  async countDocuments(query: any) {
    return this.candidateModel.countDocuments(query);
  }

  /**
   * Create candidate from social login (Google) - no emails sent
   */
  async createCandidateFromSocial(data: {
    name: string;
    email: string;
    password: string;
    isVerified: boolean;
    authProvider: string;
  }): Promise<Candidate> {
    const candidate = new this.candidateModel({
      name: data.name,
      email: data.email,
      password: data.password,
      mobile: '',
      isVerified: data.isVerified,
      authProvider: data.authProvider,
    });
    return candidate.save();
  }
}
