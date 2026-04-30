import { PartialType } from '@nestjs/swagger';
import { CreateAidRecordDto } from './create-aid-record.dto';

export class UpdateAidRecordDto extends PartialType(CreateAidRecordDto) {}

