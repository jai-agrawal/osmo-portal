import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { JobApplicationsService } from './job-applications.service';
import { CreateJobApplicationDto } from './dtos/create-job-application.dto';
import { Query as QueryInterface } from 'src/common/interfaces/query.interface';

@Controller('job-applications')
export class JobApplicationsController {
  constructor(
    private readonly jobApplicationsService: JobApplicationsService,
  ) {}

  @Post()
  create(@Body() createJobApplicationDto: CreateJobApplicationDto) {
    return this.jobApplicationsService.create(createJobApplicationDto);
  }

  @Get()
  findAll(@Query() query: QueryInterface) {
    return this.jobApplicationsService.findAll(query);
  }

  @Get('client-names')
  getApplicationClientLists(@Query('jobId') jobId: string) {
    return this.jobApplicationsService.getApplicationClientLists(jobId);
  }

  @Get('job-names')
  getApplicationJobNames(
    @Query('isCandidatePipeline') isCandidatePipeline: boolean,
  ) {
    return this.jobApplicationsService.getApplicationJobNames({
      isCandidatePipeline,
    });
  }

  @Get('dashboard-analytics')
  getDashboardAnalytics() {
    return this.jobApplicationsService.getDashboardAnalytics();
  }

  @Get(':id/next')
  getNextJobApplication(
    @Param('id') id: string,
    @Query('isCandidatePipeline') isCandidatePipeline: boolean,
  ) {
    return this.jobApplicationsService.getNextJobApplication(
      id,
      isCandidatePipeline,
    );
  }

  @Get(':id/previous')
  getPreviousJobApplication(
    @Param('id') id: string,
    @Query('isCandidatePipeline') isCandidatePipeline: boolean,
  ) {
    return this.jobApplicationsService.getPreviousJobApplication(
      id,
      isCandidatePipeline,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('isCandidatePipeline') isCandidatePipeline: boolean,
  ) {
    return this.jobApplicationsService.findOne(id, isCandidatePipeline);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() status: string) {
    return this.jobApplicationsService.updateStatus(id, status);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.jobApplicationsService.delete(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.jobApplicationsService.updateJobApplication(id, data);
  }

  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body() payload: any) {
    return this.jobApplicationsService.addComment(id, payload);
  }
}
