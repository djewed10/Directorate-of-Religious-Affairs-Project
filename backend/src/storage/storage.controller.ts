import { Body, Controller, Get, Param, Post, Put, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Request, Response } from 'express';
import { Public } from '../common/public.decorator';
import { SignUploadDto } from './dto/sign-upload.dto';
import { StorageService } from './storage.service';

@ApiTags('storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Public()
  @Post('uploads/sign')
  signUpload(@Body() dto: SignUploadDto) {
    return this.storageService.signUpload(dto);
  }

  @Public()
  @Put('local/:encodedKey')
  async uploadLocal(@Param('encodedKey') encodedKey: string, @Req() req: Request) {
    const key = decodeURIComponent(encodedKey);
    const path = this.storageService.getLocalPath(key);
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    await new Promise<void>((resolve, reject) => {
      const stream = createWriteStream(path);
      req.pipe(stream);
      req.on('error', reject);
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    return { storageKey: key };
  }

  @Public()
  @Get('local/:encodedKey')
  getLocal(@Param('encodedKey') encodedKey: string, @Res() res: Response) {
    const key = decodeURIComponent(encodedKey);
    this.storageService.createReadStream(key).pipe(res);
  }
}
