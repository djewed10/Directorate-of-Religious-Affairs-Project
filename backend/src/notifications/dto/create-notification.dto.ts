import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateNotificationDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  mosqueId?: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  titleAr: string;

  @ApiProperty()
  @IsString()
  bodyAr: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadataJson?: Record<string, unknown>;
}

