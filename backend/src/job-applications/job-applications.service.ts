import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobApplication } from './schema/job-application.schema';
import { CreateJobApplicationDto } from './dtos/create-job-application.dto';
import { Meta } from 'src/common/interfaces/meta.interface';
import { Query } from 'src/common/interfaces/query.interface';
import { JobsService } from 'src/jobs/jobs.service';
import { ClientsService } from 'src/clients/clients.service';
import CandidatesService from 'src/candidates/candidates.service';
import { MailerService } from 'src/mailer/mailer.service';
import { EmailQueueService } from 'src/email-queue/email-queue.service';
import { EmailPriority } from 'src/email-queue/schema/email-queue.schema';
const candidatePipelineStatuses = [
  'IN_REVIEW',
  'NOT_SELECTED',
  'HIRED',
  // 'IN_PIPELINE',
];

@Injectable()
export class JobApplicationsService {
  constructor(
    @InjectModel(JobApplication.name)
    private readonly jobApplicationModel: Model<JobApplication>,
    private readonly jobService: JobsService,
    private readonly clientService: ClientsService,
    private readonly candidateService: CandidatesService,
    private readonly mailerService: MailerService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  /**
   * Create a new job application
   * @param createJobApplicationDto - The job application data
   * @returns The created job application
   */
  async create(
    createJobApplicationDto: CreateJobApplicationDto,
  ): Promise<JobApplication> {
    const isCandidateAlreadyApplied = await this.jobApplicationModel.findOne(
      {
        candidateId: createJobApplicationDto.candidateId,
        jobId: createJobApplicationDto.jobId,
      },
      { _id: 1 },
    );
    if (isCandidateAlreadyApplied) {
      throw new Error('Candidate already applied for this job');
    }

    const candidate = await this.candidateService.getCandidate(
      createJobApplicationDto.candidateId,
    );
    const client = await this.clientService.findOne(
      createJobApplicationDto.clientId,
    );
    const job = await this.jobService.findOne(createJobApplicationDto.jobId);
    const jobClone: any = {
      ...job.toObject(),
    };

    createJobApplicationDto = {
      ...createJobApplicationDto,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      clientName: client.name,
      jobName: job.name,
      jobStatus: job.status,
    };

    if (candidate.assignedToId) {
      createJobApplicationDto.assignedToId = candidate.assignedToId
        ? candidate.assignedToId.toString()
        : null;
    }
    const jobApplication = new this.jobApplicationModel(
      createJobApplicationDto,
    );
    // await this.jobService.updateJobApplicationCount(
    //   createJobApplicationDto.jobId,
    //   'totalApplicants',
    // );
    const createdJobApplication = await jobApplication.save();

    const receivedHtml = await this.mailerService.renderApplicationReceivedHtml(
      candidate.name,
      job.name,
      jobClone.recruiter.email,
    );
    await this.emailQueueService.enqueueEmail({
      to: candidate.email,
      subject: `Job Application Received - ${job.name}`,
      html: receivedHtml,
      priority: EmailPriority.MEDIUM,
      templateName: 'application-received',
      metadata: { candidateName: candidate.name, jobName: job.name },
      tags: ['application-update'],
    });

    return createdJobApplication;
  }

  /**
   * Find all job applications
   * @param query - The query parameters
   * @returns The job applications and meta
   */
  async findAll(query: Query): Promise<{
    data: JobApplication[];
    meta: Meta;
  }> {
    const skip = (query.page - 1) * query.pageSize;
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
    if (query.search) {
      findConditions.$or = [
        { jobName: { $regex: query.search, $options: 'i' } },
        // { clientName: { $regex: query.search, $options: 'i' } },
        { candidateName: { $regex: query.search, $options: 'i' } },
        { candidateEmail: { $regex: query.search, $options: 'i' } },
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

    const filterKeys: any = {
      status: { type: 'array' },
      jobName: { type: 'array' },
      clientName: { type: 'array' },
      jobLocation: { type: 'string', dbKey: 'locationPreference' },
      experienceLevel: { type: 'string' },
      minExperienceLevel: { type: 'number', op: '$gte' },
      maxExperienceLevel: { type: 'number', op: '$lte' },
      areaOfExpertise: { type: 'string' },
      expectedCtc: { type: 'number', op: '$in' },
      minExpectedCtc: { type: 'number', op: '$gte' },
      maxExpectedCtc: { type: 'number', op: '$lte' },
      recruiterId: { type: 'objectId', dbKey: 'assignedToId' },
      jobId: { type: 'objectId', dbKey: 'jobId' },
      jobIds: { type: 'objectIds', dbKey: 'jobId' },
      candidateId: { type: 'objectId', dbKey: 'candidateId' },
      candidateIds: { type: 'objectIds', dbKey: 'candidateId' },
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

    if (query.isCandidatePipeline === 'true') {
      findConditions.jobStatus = { $ne: 'CLOSED' };
      if (query.status) {
        findConditions.status = {
          $in: query.status.split(','),
        };
      } else {
        findConditions.status = {
          $in: ['IN_REVIEW', 'NOT_SELECTED', 'HIRED'],
        };
      }
    }

    const selectedFields = {};
    if (query.fields) {
      for (const field of query.fields.split(',')) {
        selectedFields[field] = 1;
      }
    }

    console.log(findConditions);

    const jobApplications = await this.jobApplicationModel
      .find(findConditions)
      .populate({
        path: 'job',
        populate: { path: 'client', select: 'name' },
      })
      .populate('candidate')
      .populate({ path: 'client', select: 'name' })
      .populate({ path: 'assignedTo', select: 'name' })
      .populate({ path: 'resumeFile', select: 'name url' })
      .populate({ path: 'portfolioFile', select: 'name url' })
      .populate({ path: 'additionalFiles', select: 'name url' })
      .skip(skip)
      .limit(query.pageSize)
      .sort(query.sort)
      .select(selectedFields);

    const meta = await this.jobApplicationModel.countDocuments(findConditions);

    return {
      data: jobApplications,
      meta: {
        total: meta,
        page: query.page,
        limit: query.pageSize,
        pages: Math.ceil(meta / query.pageSize),
      },
    };
  }

  /**
   * Find a job application by id
   * @param id - The job application id
   * @returns The job application
   */
  async findOne(
    id: string,
    isCandidatePipeline: boolean = false,
  ): Promise<any> {
    const jobApplication = await this.jobApplicationModel
      .findOne({ _id: id })
      .populate('candidate')
      .populate({ path: 'job', select: 'name status' })
      .populate({ path: 'client', select: 'name code' })
      .populate({ path: 'assignedTo', select: 'name' })
      .populate({ path: 'resumeFile', select: 'name url' })
      .populate({ path: 'portfolioFile', select: 'name url' })
      .populate({ path: 'additionalFiles', select: 'name url' });

    const nextJobApplicationId = await this.getNextJobApplication(
      id,
      isCandidatePipeline,
    );
    const previousJobApplicationId = await this.getPreviousJobApplication(
      id,
      isCandidatePipeline,
    );

    return {
      ...jobApplication.toObject(),
      nextJobApplicationId,
      previousJobApplicationId,
    };
  }

  /**
   * Update the status of a job application
   * @param id - The job application id
   * @param status - The new status
   * @returns The updated job application
   */
  async updateStatus(id: string, status: string): Promise<JobApplication> {
    return this.jobApplicationModel.findByIdAndUpdate(id, { status });
  }

  /**
   * Delete a job application
   * @param id - The job application id
   * @returns The deleted job application
   */
  async delete(id: string): Promise<JobApplication> {
    return this.jobApplicationModel.findByIdAndDelete(id);
  }

  async updateJobApplication(id: string, data: any) {
    const jobApplication = await this.findOne(id);
    if (
      jobApplication.status !== 'NOT_A_MATCH' &&
      data.status === 'NOT_A_MATCH'
    ) {
      const rejectedHtml =
        await this.mailerService.renderApplicationRejectedHtml(
          jobApplication.candidateName,
          jobApplication.jobName,
          jobApplication?.client?.code,
        );
      await this.emailQueueService.enqueueEmail({
        to: jobApplication.candidateEmail,
        subject: `${jobApplication?.client?.code}: ${jobApplication.jobName} Application Status`,
        html: rejectedHtml,
        priority: EmailPriority.MEDIUM,
        templateName: 'application-rejected',
        metadata: {
          candidateName: jobApplication.candidateName,
          jobName: jobApplication.jobName,
        },
        tags: ['application-update'],
      });
    }

    if (
      jobApplication.status !== 'NOT_SELECTED' &&
      data.status === 'NOT_SELECTED'
    ) {
      const client = await this.clientService.findOne(jobApplication.clientId);
      const notSelectedHtml =
        await this.mailerService.renderApplicationNotSelectedHtml(
          jobApplication.candidateName,
          jobApplication.jobName,
          client.code,
        );
      await this.emailQueueService.enqueueEmail({
        to: jobApplication.candidateEmail,
        subject: `${client.code}: ${jobApplication.jobName} Application Status`,
        html: notSelectedHtml,
        priority: EmailPriority.MEDIUM,
        templateName: 'not-selected',
        metadata: {
          candidateName: jobApplication.candidateName,
          jobName: jobApplication.jobName,
        },
        tags: ['application-update'],
      });
    }

    if (jobApplication.status !== 'HIRED' && data.status === 'HIRED') {
      const client = await this.clientService.findOne(jobApplication.clientId);
      const hiredHtml = await this.mailerService.renderApplicationHiredHtml(
        jobApplication.candidateName,
        jobApplication.jobName,
        client.code,
      );
      await this.emailQueueService.enqueueEmail({
        to: jobApplication.candidateEmail,
        subject: `Congratulations! Your New Role as ${jobApplication.jobName}`,
        html: hiredHtml,
        priority: EmailPriority.MEDIUM,
        templateName: 'hired',
        metadata: {
          candidateName: jobApplication.candidateName,
          jobName: jobApplication.jobName,
        },
        tags: ['application-update'],
      });
    }

    return this.jobApplicationModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...data,
        },
      },
      { new: true },
    );
  }

  async updateApplicationsBasedOnFindConditions(
    findConditions: any,
    data: any,
  ) {
    return this.jobApplicationModel.updateMany(findConditions, {
      $set: {
        ...data,
      },
    });
  }

  async addComment(id: string, payload: any) {
    const data = {
      recruiterId: payload.recruiterId,
      recruiterName: payload.recruiterName,
      comment: payload.comment,
      createdAt: new Date(),
    };
    return this.jobApplicationModel.findByIdAndUpdate(
      id,
      { $push: { comments: data } },
      { new: true },
    );
  }

  async getApplicationClientLists(jobId: string | undefined) {
    const findConditions: any = {
      isDeleted: false,
    };
    if (jobId) {
      findConditions.jobId = jobId;
    }
    return this.clientService.getDistinctClientNames();
  }

  async getApplicationJobNames({
    isCandidatePipeline = false,
  }: {
    isCandidatePipeline: boolean;
  }) {
    const findConditions: any = {
      isDeleted: false,
    };
    if (isCandidatePipeline) {
      findConditions.status = { $in: candidatePipelineStatuses };
      findConditions.jobStatus = { $ne: 'CLOSED' };
    }
    const jobNames = await this.jobApplicationModel.distinct(
      'jobName',
      findConditions,
    );
    return jobNames;
  }

  async getNextJobApplication(
    jobApplicationId: string,
    isCandidatePipeline: boolean = false,
  ) {
    const findConditions: any = {
      isDeleted: false,
    };
    if (isCandidatePipeline) {
      findConditions.status = { $in: candidatePipelineStatuses };
    }
    findConditions._id = { $lt: jobApplicationId };
    const applications = await this.jobApplicationModel
      .find(findConditions)
      .sort({ _id: 1 })
      .limit(1);

    return applications[0]?._id || null;
  }

  async getPreviousJobApplication(
    jobApplicationId: string,
    isCandidatePipeline: boolean = false,
  ) {
    const findConditions: any = {
      isDeleted: false,
    };
    if (isCandidatePipeline) {
      findConditions.status = { $in: candidatePipelineStatuses };
    }
    findConditions._id = { $gt: jobApplicationId };
    const applications = await this.jobApplicationModel
      .find(findConditions)
      .sort({ _id: -1 })
      .limit(1);

    return applications[0]?._id || null;
  }

  async getDashboardAnalytics() {
    const totalActiveJobs = await this.jobService.countDocuments({
      // isDeleted: false,
      status: 'ACTIVE',
    });
    const totalShortlistedCandidates =
      await this.jobApplicationModel.countDocuments({
        isDeleted: false,
        status: 'IN_REVIEW',
        jobStatus: { $ne: 'CLOSED' },
      });
    const totalCandidatesInPipeline =
      await this.jobApplicationModel.countDocuments({
        isDeleted: false,
        status: { $in: candidatePipelineStatuses },
        jobStatus: { $ne: 'CLOSED' },
      });

    const totalCandidates = await this.candidateService.countDocuments({
      isDeleted: false,
    });
    return {
      totalActiveJobs,
      totalShortlistedCandidates,
      totalCandidatesInPipeline,
      totalCandidates,
    };
  }
}
