import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class UpdateDocumentDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  documentTypeId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  issueDate?: string | null;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expirationDate?: string | null;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;
}
