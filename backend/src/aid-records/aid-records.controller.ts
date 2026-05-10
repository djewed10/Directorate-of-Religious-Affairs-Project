import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AidRecordsService } from './aid-records.service';
import { CreateAidRecordDto } from './dto/create-aid-record.dto';
import { UpdateAidRecordDto } from './dto/update-aid-record.dto';

@ApiTags('aid-records')
@ApiBearerAuth()
@Controller('aid-records')
export class AidRecordsController {
  constructor(private readonly aidRecordsService: AidRecordsService) {}

  @Get()
  list(@Query() query: { mosqueId?: string; page?: number; limit?: number }) {
    return this.aidRecordsService.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.aidRecordsService.get(id);
  }

  @Post()
  create(@Body() dto: CreateAidRecordDto) {
    return this.aidRecordsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAidRecordDto) {
    return this.aidRecordsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.aidRecordsService.delete(id);
  }
}
