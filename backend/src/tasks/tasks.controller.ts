import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(AuthGuard('recruiter-jwt'))
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('trigger-newsletter')
  async triggerNewsletter() {
    // We execute this asynchronously so the request doesn't timeout
    // as it might take a while to enqueue 5000 emails.
    this.tasksService.handleRecommendedJobsEmail();
    return { message: 'Newsletter triggering process started' };
  }
}
