import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EmailQueueService } from './email-queue.service';

@Controller('email-queue')
@UseGuards(AuthGuard('recruiter-jwt'))
export class EmailQueueController {
  constructor(private readonly emailQueueService: EmailQueueService) {}

  @Get('stats')
  async getStats() {
    return this.emailQueueService.getQueueStats();
  }

  @Get()
  async getQueueItems(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('status') status: string,
    @Query('priority') priority: string,
    @Query('search') search: string,
  ) {
    return this.emailQueueService.getQueueItems({
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      status,
      priority,
      search,
    });
  }

  @Get(':id')
  async getEmailById(@Param('id') id: string) {
    return this.emailQueueService.getEmailById(id);
  }

  @Post(':id/retry')
  async retryFailed(@Param('id') id: string) {
    return this.emailQueueService.retryFailed(id);
  }

  @Post('retry-all')
  async retryAllFailed() {
    return this.emailQueueService.retryAllFailed();
  }

  @Post('toggle-pause')
  async togglePause(@Body('paused') paused: boolean) {
    return this.emailQueueService.toggleQueuePause(paused);
  }

  @Delete()
  async clearQueue(
    @Query('status') status: string,
    @Query('priority') priority: string,
    @Query('search') search: string,
  ) {
    return this.emailQueueService.clearQueue({ status, priority, search });
  }
}
