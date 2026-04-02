import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job } from './schema/job.schema';
import { CreateJobDto } from './dtos/create-job.dto';
import { Query } from 'src/common/interfaces/query.interface';
import { Meta } from 'src/common/interfaces/meta.interface';
import { UpdateJobDto } from './dtos/update-job.dto';
import { JobStatus } from './interfaces/job.interface';
import { JobApplication } from 'src/job-applications/schema/job-application.schema';
import { MailerService } from 'src/mailer/mailer.service';
import { EmailQueueService } from 'src/email-queue/email-queue.service';
import { EmailPriority } from 'src/email-queue/schema/email-queue.schema';
import { Candidate } from 'src/candidates/schema/candidate.schema';
import { Client } from 'src/clients/schema/client.schema';
import { Recruiter } from 'src/recruiters/schema/recruiter.schema';
import { Settings } from 'src/settings/schema/settings.schema';
@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name)
    private readonly jobModel: Model<Job>,
    @InjectModel(JobApplication.name)
    private readonly jobApplicationModel: Model<JobApplication>,
    @InjectModel(Candidate.name)
    private readonly candidateModel: Model<Candidate>,
    @InjectModel(Client.name)
    private readonly clientModel: Model<Client>,
    @InjectModel(Recruiter.name)
    private readonly recruiterModel: Model<Recruiter>,
    @InjectModel(Settings.name)
    private readonly settingsModel: Model<Settings>,
    private readonly mailerService: MailerService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  /**
   * Create a new job
   * @param createJobDto - The job data
   * @returns The created job
   */
  async create(createJobDto: CreateJobDto): Promise<Job> {
    const job = new this.jobModel(createJobDto);
    // job.status = 'ACTIVE';
    return job.save();
  }

  /**
   * Find all jobs
   * @returns The jobs
   */
  async findAll(query: Query): Promise<{
    data: Job[];
    meta: Meta;
  }> {
    const skip = (query.page - 1) * query.pageSize;
    const search = query.search;
    const findConditions = {
      ...(query.filters || {}),
    };
    if (search) {
      findConditions.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
      ];
    }

    if (query.sort) {
      const sort = query.sort.split(',');
      const sortBy = sort[0];
      const sortOrder = sort[1];
      query.sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    } else {
      query.sort = { createdAt: -1 };
    }

    // const filterKeys = [
    //   'name',
    //   'clientId',
    //   'status',
    //   'location',
    //   'roleTypes',
    //   'experience',
    //   'minExperienceLevel',
    //   'maxExperienceLevel',
    //   'workType',
    // ];
    const filterKeys: any = {
      name: { type: 'string' },
      clientId: { type: 'objectId' },
      status: { type: 'array' },
      location: { type: 'array' },
      roleTypes: { type: 'array' },
      experience: { type: 'array' },
      // For experience range overlap:
      // User's min experience -> find jobs where job's maxExperienceLevel >= value (job accepts up to that experience)
      // User's max experience -> find jobs where job's minExperienceLevel <= value (job requires at most that experience)
      minExperienceLevel: {
        type: 'number',
        op: '$gte',
        dbKey: 'maxExperienceLevel',
      },
      maxExperienceLevel: {
        type: 'number',
        op: '$lte',
        dbKey: 'minExperienceLevel',
      },
      // For CTC range overlap:
      // User's min CTC -> find jobs where job's maxAnnualCtc >= value (job pays up to at least that much)
      // User's max CTC -> find jobs where job's minAnnualCtc <= value (job starts at most that much)
      minAnnualCtc: { type: 'number', op: '$gte', dbKey: 'minAnnualCtc' },
      maxAnnualCtc: { type: 'number', op: '$lte', dbKey: 'maxAnnualCtc' },
      workType: { type: 'array' },
    };
    for (const [key, value] of Object.entries(filterKeys) as [string, any]) {
      const type = value.type;
      const dbKey = value.dbKey || key;
      if (query[key] && query[key] !== 'undefined') {
        if (['array', 'string'].includes(type)) {
          findConditions[dbKey] = { $in: query[key].split(',') };
        } else if (type === 'objectId') {
          findConditions[dbKey] = query[key]
            .split(',')
            .map((id: string) => new Types.ObjectId(id));
        } else if (type === 'objectIds') {
          findConditions[dbKey] = query[key]
            .split(',')
            .map((id: string) => new Types.ObjectId(id));
        } else if (type === 'number') {
          findConditions[dbKey] = { [value.op]: Number(query[key]) };
        } else {
          findConditions[dbKey] = query[key];
        }
      }
    }
    // for (const key of filterKeys) {
    //   if (query[key]) {
    //     if (key === 'clientId') {
    //       findConditions[key] = {
    //         $in: query[key]?.split(',').map((id) => new Types.ObjectId(id)),
    //       };
    //     } else {
    //       findConditions[key] = { $in: query[key].split(',') };
    //     }
    //   }
    // }

    findConditions.isDeleted = false;
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

    console.log(findConditions);

    const jobs = await this.jobModel
      .find(findConditions)
      .populate({ path: 'recruiter', select: 'name' })
      .populate({ path: 'client', select: 'name' })
      .skip(skip)
      .limit(query.pageSize)
      .sort(query.sort)
      .select(query.fields);

    const meta = await this.jobModel.countDocuments(findConditions);

    for (const job of jobs) {
      const totalApplicants = await this.jobApplicationModel.countDocuments({
        jobId: job._id,
      });
      const totalInPipeline = await this.jobApplicationModel.countDocuments({
        jobId: job._id,
        status: { $in: ['IN_REVIEW', 'HIRED'] },
      });
      job.totalApplicants = totalApplicants;
      job.totalInPipeline = totalInPipeline;
    }

    return {
      data: jobs,
      meta: {
        total: meta,
        page: query.page,
        limit: query.pageSize,
        pages: Math.ceil(meta / query.pageSize),
      },
    };
  }

  /**
   * Find a job by id
   * @param id - The job id
   * @returns The job
   */
  async findById(id: string): Promise<Job> {
    return this.jobModel
      .findById(id)
      .populate({ path: 'recruiter' })
      .populate({ path: 'client' });
  }

  /**
   * Update a job
   * @param id - The job id
   * @param updateJobDto - The job data
   * @returns The updated job
   */
  async update(id: string, updateJobDto: UpdateJobDto): Promise<Job> {
    // this.jobModel.findByIdAndUpdate(id, updateJobDto);
    const job = await this.findOne(id);
    Object.assign(job, updateJobDto);
    return job.save();
  }

  /**
   * Delete a job
   * @param id - The job id
   * @returns The deleted job
   */
  async delete(id: string): Promise<any> {
    await this.jobModel.updateOne(
      { _id: id },
      { $set: { isDeleted: true, status: 'INACTIVE' } },
    );
    await this.jobApplicationModel.updateMany(
      { jobId: id },
      { $set: { isDeleted: true, jobStatus: 'INACTIVE' } },
    );
    await this.jobApplicationModel.updateMany(
      {
        jobId: id,
        status: { $nin: ['HIRED', 'REJECTED'] },
      },
      {
        $set: { status: 'NOT_A_MATCH' },
      },
    );
    return this.jobModel.find({ _id: id }).lean();
  }

  /**
   * Find a job by id
   * @param id - The job id
   * @returns The job
   */
  async findOne(id: string): Promise<Job> {
    return this.findById(id);
  }

  /**
   * Publish a job
   * @param id - The job id
   * @returns The published job
   */
  async publish(id: string): Promise<Job> {
    return this.jobModel.findByIdAndUpdate(id, { status: 'ACTIVE' });
  }

  async updateJobApplicationCount(id: string, field: string) {
    const job = await this.jobModel.findById(id).lean();
    return this.jobModel.findByIdAndUpdate(id, {
      $set: { [field]: job[field] + 1 },
    });
  }

  async updateJobStatus(id: string, jobStatus: JobStatus) {
    const job = await this.findOne(id);
    job.status = jobStatus;

    const jobApplicationUpdate: any = {
      jobStatus,
    };
    const jobApplicationFindConditions = {
      jobId: id,
    };
    if (['CLOSED'].includes(jobStatus)) {
      await this.jobApplicationModel.updateMany(
        {
          jobId: id,
          status: { $nin: ['HIRED', 'REJECTED', 'NOT_A_MATCH'] },
        },
        {
          $set: { status: 'NOT_A_MATCH' },
        },
      );
    }
    await this.jobApplicationModel.updateMany(
      jobApplicationFindConditions,
      jobApplicationUpdate,
    );

    return job.save();
  }

  async getAllJobNames() {
    return {
      data: await this.jobModel.distinct('name'),
    };
  }

  async getAllJobLocations() {
    const settings = await this.settingsModel.findOne();
    return {
      data: settings.settings.jobLocation.options,
    };
  }

  async sendNotificationToCandidatesAfterDuplication(job) {
    const candidateEmails = await this.jobApplicationModel.distinct(
      'candidateEmail',
      {
        jobId: job._id,
        status: { $nin: ['HIRED'] },
      },
    );

    const client = await this.clientModel.findById(job.clientId);
    const recruiter = await this.recruiterModel.findById(job.recruiterId);

    const emails = [];
    for (const email of candidateEmails) {
      const candidate: any = await this.candidateModel.findOne(
        { email },
        {
          name: 1,
          email: 1,
        },
      );
      if (candidate) {
        emails.push({
          userName: candidate.name,
          candidateEmail: email,
          recruiterEmail: recruiter.email,
          companyName: client.code,
          jobName: job.name,
        });
      }
    }

    for (const emailData of emails) {
      const html = await this.mailerService.renderJobReopeningHtml(emailData);
      await this.emailQueueService.enqueueEmail({
        to: emailData.candidateEmail,
        subject: `The ${emailData.jobName} Role at ${emailData.companyName} is Open Again`,
        html,
        priority: EmailPriority.MEDIUM,
        templateName: 'reopen-job',
        metadata: {
          candidateName: emailData.userName,
          jobName: emailData.jobName,
        },
      });
    }
  }

  async duplicateJob(id: string, data: { toBeNotified: boolean }) {
    const job = await this.findOne(id);
    const newJob = job.toObject();
    delete newJob._id;
    delete newJob.createdAt;
    delete newJob.updatedAt;
    delete newJob.id;
    newJob.totalApplicants = 0;
    newJob.totalInPipeline = 0;
    newJob.status = 'DRAFT';
    newJob.isDeleted = false;
    if (data.toBeNotified) {
      await this.sendNotificationToCandidatesAfterDuplication(job);
    }
    return this.create(newJob);
  }

  async countDocuments(query: any) {
    return this.jobModel.countDocuments(query);
  }
}
