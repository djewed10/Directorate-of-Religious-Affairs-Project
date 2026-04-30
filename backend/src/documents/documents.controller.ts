import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth-user.decorator';
import type { AuthUser } from '../common/types';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  list(@Query() query: { mosqueId?: string; documentTypeId?: string; status?: string }) {
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

  @Get(':id/versions')
  versions(@Param('id') id: string) {
    return this.documentsService.versions(id);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.documentsService.softDelete(id);
  }
}

