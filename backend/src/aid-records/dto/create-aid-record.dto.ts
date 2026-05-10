import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAidRecordDto {
  @ApiProperty()
  @IsUUID()
  mosqueId: string;

  @ApiProperty({ example: 1200000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: '2026-04-24' })
  @IsDateString()
  aidDate: string;

  @ApiPropertyOptional({ enum: ['friday_donations', 'grant', 'other'] })
  @IsIn(['friday_donations', 'grant', 'other'])
  @IsOptional()
  sourceType?: 'friday_donations' | 'grant' | 'other';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  attachmentStorageKey?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  attachmentMimeType?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  attachmentFileSize?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  attachmentOriginalFilename?: string;
}
