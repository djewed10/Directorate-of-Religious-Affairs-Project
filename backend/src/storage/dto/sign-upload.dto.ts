import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SignUploadDto {
  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  mimeType: string;

  @ApiProperty({ example: 'technical-sheet.pdf' })
  @IsString()
  originalFilename: string;

  @ApiPropertyOptional({ example: 'documents' })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  fileSize?: number;
}

