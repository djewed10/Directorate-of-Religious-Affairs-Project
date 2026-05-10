import { PartialType } from '@nestjs/swagger';
import { CreateConsumptionDto } from './create-consumption.dto';

export class UpdateConsumptionDto extends PartialType(CreateConsumptionDto) {}
