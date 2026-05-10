import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReferenceService } from './reference.service';

@ApiTags('reference')
@ApiBearerAuth()
@Controller('reference')
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Get()
  all() {
    return this.referenceService.all();
  }

  @Get('suggestions')
  suggestions(@Query('field') field: string, @Query('q') q?: string) {
    return this.referenceService.suggestions(field, q);
  }
}
