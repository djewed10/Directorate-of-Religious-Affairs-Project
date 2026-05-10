import { PartialType } from '@nestjs/swagger';
import { CreateInternalNoteDto } from './create-internal-note.dto';

export class UpdateInternalNoteDto extends PartialType(CreateInternalNoteDto) {}
