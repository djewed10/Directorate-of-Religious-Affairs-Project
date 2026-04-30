import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { ConsumptionMediaDto } from '../../consumption/dto/consumption-media.dto';
import { ProgressionMediaDto } from '../../progression/dto/progression-media.dto';

export class SubmitExternalRequestDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  withdrawnAmount?: number;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  aidRecordId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  consumptionCategoryCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shortNote?: string;

  @ApiPropertyOptional({ type: [ConsumptionMediaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumptionMediaDto)
  @IsOptional()
  consumptionMedia?: ConsumptionMediaDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  progressionStageCode?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progressPercent?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  progressionNote?: string;

  @ApiPropertyOptional({ type: [ProgressionMediaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressionMediaDto)
  @IsOptional()
  progressionMedia?: ProgressionMediaDto[];

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  documentTypeId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  documentStorageKey?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  documentMimeType?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  documentFileSize?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  documentOriginalFilename?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  coverImageStorageKey?: string;
}

