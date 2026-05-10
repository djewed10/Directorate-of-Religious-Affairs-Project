import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateMosqueDto } from './dto/create-mosque.dto';
import { UpdateMosqueDto } from './dto/update-mosque.dto';
import { MosquesService } from './mosques.service';

@ApiTags('mosques')
@ApiBearerAuth()
@Controller('mosques')
export class MosquesController {
  constructor(private readonly mosquesService: MosquesService) {}

  @Get()
  list(@Query() query: { q?: string; page?: number; limit?: number; status?: string; receivesFridayDonations?: string }) {
    return this.mosquesService.list(query);
  }

  @Post()
  create(@Body() dto: CreateMosqueDto) {
    return this.mosquesService.create(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.mosquesService.get(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMosqueDto) {
    return this.mosquesService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.mosquesService.delete(id);
  }

  @Get(':id/wallet')
  wallet(@Param('id') id: string) {
    return this.mosquesService.wallet(id);
  }

  @Get(':id/notes')
  notes(@Param('id') id: string) {
    return this.mosquesService.notes(id);
  }
}
