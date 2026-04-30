import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth-user.decorator';
import type { AuthUser } from '../common/types';
import { CreateProgressionDto } from './dto/create-progression.dto';
import { ProgressionService } from './progression.service';

@ApiTags('progression')
@ApiBearerAuth()
@Controller('progression')
export class ProgressionController {
  constructor(private readonly progressionService: ProgressionService) {}

  @Get()
  list(@Query('mosqueId') mosqueId?: string) {
    return this.progressionService.list(mosqueId);
  }

  @Post()
  create(@Body() dto: CreateProgressionDto, @CurrentUser() user: AuthUser) {
    return this.progressionService.create(dto, user);
  }
}

