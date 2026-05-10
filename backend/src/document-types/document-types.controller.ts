import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/public.decorator';
import { Roles } from '../common/roles.decorator';
import { DocumentTypesService } from './document-types.service';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';

@ApiTags('document-types')
@ApiBearerAuth()
@Controller('document-types')
export class DocumentTypesController {
  constructor(private readonly documentTypesService: DocumentTypesService) {}

  @Get()
  list(@Query() query: { includeInactive?: string; q?: string; page?: number; limit?: number }) {
    return this.documentTypesService.list(query);
  }

  @Public()
  @Get('public')
  publicList(@Query() query: { q?: string; page?: number; limit?: number }) {
    return this.documentTypesService.list({ ...query, includeInactive: false, limit: query.limit ?? 100 });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.documentTypesService.get(id);
  }

  @Post()
  @Roles('admin', 'manager')
  create(@Body() dto: CreateDocumentTypeDto) {
    return this.documentTypesService.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentTypeDto) {
    return this.documentTypesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  delete(@Param('id') id: string) {
    return this.documentTypesService.delete(id);
  }
}
