import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import type { TimelineSourceKind } from '../../db/schema';
import { ConsumptionMediaDto } from './consumption-media.dto';

export class CreateConsumptionDto {
  @ApiProperty()
  @IsUUID()
  mosqueId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  aidRecordId?: string;

  @ApiPropertyOptional({ enum: ['internal', 'external'] })
  @IsIn(['internal', 'external'])
  @IsOptional()
  sourceKind?: TimelineSourceKind;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  consumptionCategoryCode?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  withdrawnAmount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shortNote?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  optionalProgressPercent?: number;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  externalRequestId?: string;

  @ApiPropertyOptional({ type: [ConsumptionMediaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumptionMediaDto)
  @IsOptional()
  media?: ConsumptionMediaDto[];
}

