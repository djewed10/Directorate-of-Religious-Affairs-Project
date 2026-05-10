import { PartialType } from '@nestjs/swagger';
import { CreateProgressionDto } from './create-progression.dto';

export class UpdateProgressionDto extends PartialType(CreateProgressionDto) {}
