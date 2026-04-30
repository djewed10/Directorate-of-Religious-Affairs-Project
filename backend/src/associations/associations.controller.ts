import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateAssociationDto } from './dto/create-association.dto';
import { UpdateAssociationDto } from './dto/update-association.dto';
import { AssociationsService } from './associations.service';

@ApiTags('associations')
@ApiBearerAuth()
@Controller('associations')
export class AssociationsController {
  constructor(private readonly associationsService: AssociationsService) {}

  @Get()
  list(@Query() query: { q?: string; page?: number; limit?: number }) {
    return this.associationsService.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.associationsService.get(id);
  }

  @Post()
  create(@Body() dto: CreateAssociationDto) {
    return this.associationsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAssociationDto) {
    return this.associationsService.update(id, dto);
  }
}

