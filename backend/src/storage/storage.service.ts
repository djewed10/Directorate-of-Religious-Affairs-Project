import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream, existsSync, mkdirSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { nanoid } from 'nanoid';
import { SignUploadDto } from './dto/sign-upload.dto';

@Injectable()
export class StorageService {
  private readonly driver: 'local' | 's3';
  private readonly localDir: string;
  private readonly s3?: S3Client;

  constructor(private readonly config: ConfigService) {
    this.driver = config.get<'local' | 's3'>('STORAGE_DRIVER', 'local');
    this.localDir = config.get<string>('LOCAL_STORAGE_DIR', './storage-local');
    if (!existsSync(this.localDir)) mkdirSync(this.localDir, { recursive: true });
    if (this.driver === 's3') {
      this.s3 = new S3Client({
        region: config.get<string>('S3_REGION', 'auto'),
        endpoint: config.get<string>('S3_ENDPOINT'),
        forcePathStyle: config.get<string>('S3_FORCE_PATH_STYLE', 'true') === 'true',
        credentials: {
          accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY_ID'),
          secretAccessKey: config.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
        },
      });
    }
  }

  async signUpload(dto: SignUploadDto) {
    const safeName = dto.originalFilename.replace(/[^\w.\-]+/g, '-').slice(-80) || 'upload.bin';
    const folder = (dto.folder ?? 'uploads').replace(/[^\w/-]+/g, '-');
    const storageKey = `${folder}/${new Date().toISOString().slice(0, 10)}/${nanoid(18)}-${safeName}`;

    if (this.driver === 's3') {
      const bucket = this.config.getOrThrow<string>('S3_BUCKET');
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        ContentType: dto.mimeType,
      });
      const uploadUrl = await getSignedUrl(this.s3!, command, { expiresIn: 900 });
      return {
        driver: 's3',
        storageKey,
        uploadUrl,
        method: 'PUT',
        headers: { 'Content-Type': dto.mimeType },
      };
    }

    const appBaseUrl = this.config.get<string>('APP_BASE_URL', 'http://localhost:3000');
    return {
      driver: 'local',
      storageKey,
      uploadUrl: `${appBaseUrl}/api/storage/local/${encodeURIComponent(storageKey)}`,
      publicUrl: `${appBaseUrl}/api/storage/local/${encodeURIComponent(storageKey)}`,
      method: 'PUT',
      headers: { 'Content-Type': dto.mimeType },
    };
  }

  getLocalPath(storageKey: string) {
    const normalized = normalize(storageKey).replace(/^(\.\.[/\\])+/, '');
    return join(this.localDir, normalized);
  }

  createReadStream(storageKey: string) {
    return createReadStream(this.getLocalPath(storageKey));
  }
}

