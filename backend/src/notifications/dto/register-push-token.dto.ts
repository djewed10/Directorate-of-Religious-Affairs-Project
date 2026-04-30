import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RegisterPushTokenDto {
  @ApiProperty({ example: 'ios' })
  @IsString()
  platform: string;

  @ApiProperty()
  @IsString()
  expoPushToken: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deviceName?: string;
}

