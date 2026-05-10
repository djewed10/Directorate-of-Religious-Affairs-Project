import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth-user.decorator';
import type { AuthUser } from '../common/types';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  list(@Query() query: { mosqueId?: string; documentTypeId?: string; status?: string; page?: number; limit?: number }) {
    return this.documentsService.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.documentsService.get(id);
  }

  @Post()
  create(@Body() dto: CreateDocumentDto, @CurrentUser() user: AuthUser) {
    return this.documentsService.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(id, dto);
  }

  @Get(':id/versions')
  versions(@Param('id') id: string) {
    return this.documentsService.versions(id);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.documentsService.softDelete(id);
  }
}
