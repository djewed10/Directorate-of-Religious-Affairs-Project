import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth-user.decorator';
import type { AuthUser } from '../common/types';
import { ConsumptionService } from './consumption.service';
import { CreateConsumptionDto } from './dto/create-consumption.dto';
import { UpdateConsumptionDto } from './dto/update-consumption.dto';

@ApiTags('consumption')
@ApiBearerAuth()
@Controller('consumption')
export class ConsumptionController {
  constructor(private readonly consumptionService: ConsumptionService) {}

  @Get()
  list(@Query() query: { mosqueId?: string; page?: number; limit?: number }) {
    return this.consumptionService.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.consumptionService.get(id);
  }

  @Post()
  create(@Body() dto: CreateConsumptionDto, @CurrentUser() user: AuthUser) {
    return this.consumptionService.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConsumptionDto) {
    return this.consumptionService.update(id, dto);
  }

  @Delete('media/:id')
  deleteMedia(@Param('id') id: string) {
    return this.consumptionService.deleteMedia(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.consumptionService.delete(id);
  }
}
