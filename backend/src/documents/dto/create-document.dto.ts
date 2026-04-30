import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import type { DocumentSourceKind } from '../../db/schema';

export class CreateDocumentDto {
  @ApiProperty()
  @IsUUID()
  mosqueId: string;

  @ApiProperty()
  @IsUUID()
  documentTypeId: string;

  @ApiPropertyOptional({ enum: ['internal_upload', 'external_upload', 'renewal_upload'] })
  @IsIn(['internal_upload', 'external_upload', 'renewal_upload'])
  @IsOptional()
  sourceKind?: DocumentSourceKind;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiProperty()
  @IsString()
  storageKey: string;

  @ApiProperty()
  @IsString()
  mimeType: string;

  @ApiProperty()
  @IsInt()
  fileSize: number;

  @ApiProperty()
  @IsString()
  originalFilename: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @ApiPropertyOptional({ enum: ['archive_current', 'trash_current_later', 'additional'] })
  @IsIn(['archive_current', 'trash_current_later', 'additional'])
  @IsOptional()
  replacementMode?: 'archive_current' | 'trash_current_later' | 'additional';
}

