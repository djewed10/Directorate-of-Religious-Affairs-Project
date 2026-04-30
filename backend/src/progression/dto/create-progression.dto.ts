import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import type { TimelineSourceKind } from '../../db/schema';
import { ProgressionMediaDto } from './progression-media.dto';

export class CreateProgressionDto {
  @ApiProperty()
  @IsUUID()
  mosqueId: string;

  @ApiPropertyOptional({ enum: ['internal', 'external'] })
  @IsIn(['internal', 'external'])
  @IsOptional()
  sourceKind?: TimelineSourceKind;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stageCode?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progressPercent?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shortNote?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  externalRequestId?: string;

  @ApiPropertyOptional({ type: [ProgressionMediaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressionMediaDto)
  @IsOptional()
  media?: ProgressionMediaDto[];
}

