import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth-user.decorator';
import type { AuthUser } from '../common/types';
import { CreateProgressionDto } from './dto/create-progression.dto';
import { UpdateProgressionDto } from './dto/update-progression.dto';
import { ProgressionService } from './progression.service';

@ApiTags('progression')
@ApiBearerAuth()
@Controller('progression')
export class ProgressionController {
  constructor(private readonly progressionService: ProgressionService) {}

  @Get()
  list(@Query() query: { mosqueId?: string; page?: number; limit?: number }) {
    return this.progressionService.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.progressionService.get(id);
  }

  @Post()
  create(@Body() dto: CreateProgressionDto, @CurrentUser() user: AuthUser) {
    return this.progressionService.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProgressionDto) {
    return this.progressionService.update(id, dto);
  }

  @Delete('media/:id')
  deleteMedia(@Param('id') id: string) {
    return this.progressionService.deleteMedia(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.progressionService.delete(id);
  }
}
