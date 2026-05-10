import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth-user.decorator';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import type { AuthUser } from '../common/types';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
@UseGuards(RolesGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * Debug endpoint (admin only): Send a test notification to trigger push notification
   * Useful for testing the entire notification pipeline
   */
  @Post('test-notification')
  @Roles('admin')
  async sendTestNotification(@CurrentUser() user: AuthUser) {
    return this.jobsService.sendTestNotificationToUser(user.sub);
  }
}
