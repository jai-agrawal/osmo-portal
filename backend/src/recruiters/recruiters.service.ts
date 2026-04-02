import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Recruiter } from './schema/recruiter.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRecruiterDto } from './dtos/create-recruiter.dto';
import { UpdateRecruiterDto } from '../auth/recruiter/dtos/update-recruiter.dto';
import { Query } from 'src/common/interfaces/query.interface';
import { Meta } from 'src/common/interfaces/meta.interface';
import { MailerService } from 'src/mailer/mailer.service';
import { EmailQueueService } from 'src/email-queue/email-queue.service';
import { EmailPriority } from 'src/email-queue/schema/email-queue.schema';
import { generatePassword } from 'src/common/utils/password';
import { randomBytes } from 'crypto';
import { Candidate } from 'src/candidates/schema/candidate.schema';
import { JobApplication } from 'src/job-applications/schema/job-application.schema';

@Injectable()
export class RecruitersService {
  private readonly logger = new Logger(RecruitersService.name);

  constructor(
    @InjectModel(Recruiter.name)
    private readonly recruiterModel: Model<Recruiter>,
    @InjectModel(Candidate.name)
    private readonly candidateModel: Model<Candidate>,
    @InjectModel(JobApplication.name)
    private readonly jobApplicationModel: Model<JobApplication>,
    private readonly mailerService: MailerService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  /**
   * Find all recruiters
   * @param query - The query parameters
   * @returns The recruiters and meta information
   */
  async findAll(query: Query): Promise<{
    recruiters: Recruiter[];
    meta: Meta;
  }> {
    const { page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    this.logger.log(
      `Finding recruiters with filters: ${JSON.stringify(query)}, page: ${page}, limit: ${limit}`,
    );

    const findQuery: any = { ...query };
    if (findQuery.isDeleted !== 'true') {
      findQuery.isDeleted = false;
    } else {
      delete findQuery.isDeleted;
    }

    if (query.startDate || query.endDate) {
      findQuery.createdAt = {};
      if (query.startDate) {
        findQuery.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        findQuery.createdAt.$lte = end;
      }
      delete findQuery.startDate;
      delete findQuery.endDate;
    }

    const [recruiters, total] = await Promise.all([
      this.recruiterModel.find(findQuery).skip(skip).limit(limit).lean().exec(),
      this.recruiterModel.countDocuments(findQuery),
    ]);
    return {
      recruiters: recruiters as unknown as Recruiter[],
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a recruiter by ID
   * @param id - The ID of the recruiter to find
   * @returns The recruiter
   */
  async findOne(id: string): Promise<Recruiter> {
    this.logger.log(`Finding recruiter: ${id}`);
    const recruiter = await this.recruiterModel.findById(id);
    if (!recruiter) {
      this.logger.error(`Recruiter not found: ${id}`);
      throw new NotFoundException('Recruiter not found');
    }
    return recruiter;
  }

  /**
   * Find a recruiter by email
   * @param email - The email of the recruiter to find
   * @returns The recruiter or null if not found
   */
  async findByEmail(
    email: string,
    isPasswordRequired: boolean = false,
  ): Promise<Recruiter | null> {
    return this.recruiterModel
      .findOne({ email })
      .select(isPasswordRequired ? '+password' : '')
      .exec() as Promise<Recruiter | null>;
  }

  /**
   * Find a recruiter by condition
   * @param condition - The condition to find the recruiter
   * @returns The recruiter or null if not found
   */
  async findOneByCondition(
    condition: any,
    { isLean = false }: { isLean: boolean } = { isLean: false },
  ): Promise<Recruiter | null> {
    const query = this.recruiterModel.findOne(condition);
    if (isLean) {
      query.lean();
    }
    return query.exec() as Promise<Recruiter | null>;
  }

  /**
   * Create a recruiter
   * @param createRecruiterDto - The data to create the recruiter with
   * @returns The created recruiter
   */
  async create(createRecruiterDto: CreateRecruiterDto) {
    // Check for existing recruiter with the same email
    const existingRecruiter = await this.findByEmail(createRecruiterDto.email);
    if (existingRecruiter) {
      throw new ConflictException({
        message: 'A recruiter with this email already exists',
        error: 'Duplicate email',
      });
    }

    try {
      const recruiter = new this.recruiterModel(createRecruiterDto);
      const generatedPassword = randomBytes(4).toString('hex').slice(0, 8);
      recruiter.password = await generatePassword(generatedPassword);
      // recruiter.password = await generatePassword(
      //   randomBytes(16).toString('hex'),
      // );
      const savedRecruiter = await recruiter.save();
      const html = await this.mailerService.renderPasswordEmailOnSignUpHtml(
        savedRecruiter.email,
        generatedPassword,
      );
      await this.emailQueueService.enqueueEmail({
        to: savedRecruiter.email,
        subject: 'Welcome to Osmo',
        html,
        priority: EmailPriority.MEDIUM,
        templateName: 'set-password',
        metadata: { recruiterName: savedRecruiter.name },
      });
      return savedRecruiter;
    } catch (error) {
      this.logger.error(`Failed to create recruiter: ${error.message}`);
      throw error;
    }
  }

  async handleRecruiterActive(recruiter: Recruiter) {
    if (recruiter.isDeleted) {
      await this.jobApplicationModel.updateMany(
        { assignedToId: recruiter._id },
        { $unset: { assignedToId: 1 } },
      );
      await this.candidateModel.updateMany(
        { assignedToId: recruiter._id },
        { $unset: { assignedToId: 1 } },
      );
    }
    return;
  }

  /**
   * Update a recruiter
   * @param id - The ID of the recruiter to update
   * @param updateRecruiterDto - The data to update the recruiter with
   * @returns The updated recruiter
   */
  async update(id: string, updateRecruiterDto: UpdateRecruiterDto) {
    this.logger.log(
      `Updating recruiter: ${JSON.stringify(updateRecruiterDto)}`,
    );
    const updatedRecruiter = await this.recruiterModel.findByIdAndUpdate(
      id,
      updateRecruiterDto,
      { new: true },
    );
    await this.handleRecruiterActive(updatedRecruiter);
    if (!updatedRecruiter) {
      this.logger.error(`Recruiter not found: ${id}`);
      throw new NotFoundException('Recruiter not found');
    }
    return this.findOne(id);
  }

  /**
   * Soft delete a recruiter
   * @param id - The ID of the recruiter to delete
   * @returns The deleted recruiter
   */
  async delete(id: string) {
    this.logger.log(`Deleting recruiter: ${id}`);
    const recruiter = await this.findOne(id);
    const updatedRecruiter = await this.recruiterModel.findByIdAndUpdate(
      id,
      { isDeleted: !recruiter.isDeleted },
      { new: true },
    );
    if (!updatedRecruiter) {
      this.logger.error(`Recruiter not found: ${id}`);
      throw new NotFoundException('Recruiter not found');
    }
    return updatedRecruiter;
  }

  async getDashboard() {
    const recruiters = await this.recruiterModel.find({
      isDeleted: false,
    });

    const dashboard = [];
    for (const recruiter of recruiters) {
      const totalCreatedCandidates = await this.candidateModel.countDocuments({
        createdBy: recruiter._id,
        isDeleted: false,
      });
      const totalAssignedCandidates = await this.candidateModel.countDocuments({
        assignedToId: recruiter._id,
        isDeleted: false,
      });
      dashboard.push({
        recruiter,
        totalCreatedCandidates,
        totalAssignedCandidates,
      });
    }
    return dashboard;
  }
}
