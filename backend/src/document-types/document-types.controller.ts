import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  list(@Query('includeInactive') includeInactive?: string) {
    return this.documentTypesService.list(includeInactive === 'true');
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
}

