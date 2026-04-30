import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import type { DocumentGroup, RetentionPolicy } from '../../db/schema';

export class CreateDocumentTypeDto {
  @ApiProperty({ example: 'new_admin_doc' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'وثيقة إدارية جديدة' })
  @IsString()
  labelAr: string;

  @ApiProperty({ enum: ['mosque_file', 'association_file', 'technical', 'financial', 'consumption', 'progression', 'other'] })
  @IsIn(['mosque_file', 'association_file', 'technical', 'financial', 'consumption', 'progression', 'other'])
  group: DocumentGroup;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  supportsExpiration?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isRequiredDefault?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPinnedDefault?: boolean;

  @ApiPropertyOptional({
    enum: ['keep_all_versions', 'archive_old_versions', 'replace_after_confirmation', 'temporary_delete_after_days'],
  })
  @IsIn(['keep_all_versions', 'archive_old_versions', 'replace_after_confirmation', 'temporary_delete_after_days'])
  @IsOptional()
  retentionPolicy?: RetentionPolicy;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

