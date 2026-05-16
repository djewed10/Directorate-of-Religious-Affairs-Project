import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import type { ExternalRequestType } from '../../db/schema';

export class CreateExternalRequestDto {
  @ApiProperty()
  @IsUUID()
  mosqueId: string;

  @ApiProperty({
    enum: ['consumption_control', 'progression_update', 'document_renewal', 'document_upload', 'cover_image_update'],
  })
  @IsIn(['consumption_control', 'progression_update', 'document_renewal', 'document_upload', 'cover_image_update'])
  requestType: ExternalRequestType;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  relatedDocumentId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ default: 14 })
  @IsInt()
  @Min(1)
  @Max(100, { message: 'أقصى مدة مسموحة هي 100 يوم' })
  @IsOptional()
  expiresInDays?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowProgressionFields?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowCoverUpdate?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowLocationUpdate?: boolean;
}
