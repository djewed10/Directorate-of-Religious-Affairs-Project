import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import type { UserRole } from '../../db/schema';

export class CreateUserDto {
  @ApiProperty({ example: 'موظف المتابعة' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'operator@mosque.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: ['admin', 'manager', 'operator'] })
  @IsIn(['admin', 'manager', 'operator'])
  role: UserRole;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

