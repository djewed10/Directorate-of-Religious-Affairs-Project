import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInternalNoteDto {
  @ApiProperty()
  @IsUUID()
  mosqueId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  templateCode?: string;

  @ApiProperty()
  @IsString()
  content: string;
}

