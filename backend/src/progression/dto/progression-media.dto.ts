import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class ProgressionMediaDto {
  @ApiProperty({ enum: ['image', 'document'] })
  @IsIn(['image', 'document'])
  fileKind: 'image' | 'document';

  @ApiProperty()
  @IsString()
  storageKey: string;

  @ApiProperty()
  @IsString()
  mimeType: string;

  @ApiProperty()
  @IsInt()
  fileSize: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  autoTitle?: string;
}

