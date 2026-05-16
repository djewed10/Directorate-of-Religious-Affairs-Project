import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import type { MosqueStatusCode, ZoneType } from '../../db/schema';

export class CreateMosqueDto {
  @ApiProperty({ example: '2026-001' })
  @IsString()
  officialCode: string;

  @ApiProperty({ example: 'مسجد النور' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  associationId?: string;

  @ApiProperty({ example: 'السانية' })
  @IsString()
  commune: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  daira?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  wilaya?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'حي خميستي، بلدية السانية' })
  @IsString()
  @IsOptional()
  addressText?: string | null;

  @ApiPropertyOptional({ example: 'https://maps.app.goo.gl/...' })
  @ValidateIf((dto: CreateMosqueDto) => dto.googleMapsUrl !== undefined && dto.googleMapsUrl !== null && dto.googleMapsUrl !== '')
  @IsUrl({}, { message: 'رابط خرائط Google غير صالح' })
  @IsOptional()
  googleMapsUrl?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locationText?: string;

  @ApiPropertyOptional({ enum: ['urban', 'rural', 'semi_urban'] })
  @IsIn(['urban', 'rural', 'semi_urban'])
  @IsOptional()
  zoneType?: ZoneType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  classification?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  populationCoverage?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  poorAreaFlag?: boolean;

  @ApiPropertyOptional({
    enum: ['under_construction', 'completed', 'renovation', 'neighborhood_no_friday', 'light_follow_up', 'archived'],
  })
  @IsIn(['under_construction', 'completed', 'renovation', 'neighborhood_no_friday', 'light_follow_up', 'archived'])
  @IsOptional()
  mosqueStatus?: MosqueStatusCode;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  receivesFridayDonations?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  currentProgressPercent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  estimatedTotalProjectCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  estimatedCompletionCost?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  coverImageStorageKey?: string;
}
