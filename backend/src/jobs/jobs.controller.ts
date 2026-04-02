import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dtos/create-job.dto';
import { Query as QueryInterface } from 'src/common/interfaces/query.interface';
import { UpdateJobDto } from './dtos/update-job.dto';
import { JobStatus } from './interfaces/job.interface';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  create(@Body() createJobDto: CreateJobDto) {
    return this.jobsService.create(createJobDto);
  }

  @Get()
  findAll(@Query() query: QueryInterface) {
    return this.jobsService.findAll(query);
  }

  @Get('names')
  getAllJobNames() {
    return this.jobsService.getAllJobNames();
  }

  @Get('locations')
  getAllJobLocations() {
    return this.jobsService.getAllJobLocations();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto) {
    return this.jobsService.update(id, updateJobDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.jobsService.delete(id);
  }

  @Put(':id/publish')
  publish(@Param('id') id: string) {
    return this.jobsService.publish(id);
  }

  @Put(':id/status')
  updateJobStatus(
    @Param('id') id: string,
    @Body() data: { jobStatus: JobStatus },
  ) {
    return this.jobsService.updateJobStatus(id, data.jobStatus);
  }

  @Post(':id/duplicate')
  duplicateJob(
    @Param('id') id: string,
    @Body() data: { toBeNotified: boolean },
  ) {
    return this.jobsService.duplicateJob(id, data);
  }
}
