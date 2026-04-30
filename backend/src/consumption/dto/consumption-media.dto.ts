import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class ConsumptionMediaDto {
  @ApiProperty({ enum: ['image', 'document'] })
  @IsIn(['image', 'document'])
  fileKind: 'image' | 'document';

  @ApiProperty({ enum: ['cheque_image', 'invoice', 'handwritten_note', 'progression_photo', 'other'] })
  @IsIn(['cheque_image', 'invoice', 'handwritten_note', 'progression_photo', 'other'])
  mediaType: 'cheque_image' | 'invoice' | 'handwritten_note' | 'progression_photo' | 'other';

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

