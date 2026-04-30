import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth-user.decorator';
import type { AuthUser } from '../common/types';
import { CreateInternalNoteDto } from './dto/create-internal-note.dto';
import { InternalNotesService } from './internal-notes.service';

@ApiTags('internal-notes')
@ApiBearerAuth()
@Controller()
export class InternalNotesController {
  constructor(private readonly internalNotesService: InternalNotesService) {}

  @Get('note-templates')
  templates() {
    return this.internalNotesService.templates();
  }

  @Get('internal-notes')
  list(@Query('mosqueId') mosqueId: string) {
    return this.internalNotesService.list(mosqueId);
  }

  @Post('internal-notes')
  create(@Body() dto: CreateInternalNoteDto, @CurrentUser() user: AuthUser) {
    return this.internalNotesService.create(dto, user);
  }

  @Delete('internal-notes/:id')
  delete(@Param('id') id: string) {
    return this.internalNotesService.delete(id);
  }
}

