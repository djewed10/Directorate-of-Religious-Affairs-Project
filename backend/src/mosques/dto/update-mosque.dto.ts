import { PartialType } from '@nestjs/swagger';
import { CreateMosqueDto } from './create-mosque.dto';

export class UpdateMosqueDto extends PartialType(CreateMosqueDto) {}

