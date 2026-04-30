import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth-user.decorator';
import type { AuthUser } from '../common/types';
import { ConsumptionService } from './consumption.service';
import { CreateConsumptionDto } from './dto/create-consumption.dto';

@ApiTags('consumption')
@ApiBearerAuth()
@Controller('consumption')
export class ConsumptionController {
  constructor(private readonly consumptionService: ConsumptionService) {}

  @Get()
  list(@Query('mosqueId') mosqueId?: string) {
    return this.consumptionService.list(mosqueId);
  }

  @Post()
  create(@Body() dto: CreateConsumptionDto, @CurrentUser() user: AuthUser) {
    return this.consumptionService.create(dto, user);
  }
}

