import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream, existsSync, mkdirSync } from 'node:fs';
import { join, normalize } from 'node:path';
import os from 'node:os';
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

    const appBaseUrl = this.resolveAppBaseUrl();

    return {
      driver: 'local',
      storageKey,
      uploadUrl: `${appBaseUrl}/api/storage/local/${encodeURIComponent(storageKey)}`,
      publicUrl: `${appBaseUrl}/api/storage/local/${encodeURIComponent(storageKey)}`,
      method: 'PUT',
      headers: { 'Content-Type': dto.mimeType },
    };
  }

  async signViewUrl(storageKey: string) {
    if (!storageKey) return { url: null, expiresIn: 0 };
    if (this.driver === 's3') {
      const bucket = this.config.getOrThrow<string>('S3_BUCKET');
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      });
      return {
        url: await getSignedUrl(this.s3!, command, { expiresIn: 900 }),
        expiresIn: 900,
      };
    }

    const appBaseUrl = this.resolveAppBaseUrl();
    return {
      url: `${appBaseUrl}/api/storage/local/${encodeURIComponent(storageKey)}`,
      expiresIn: 0,
    };
  }

  private resolveAppBaseUrl() {
    const configured = this.config.get<string>('APP_BASE_URL', 'http://localhost:3000');
    try {
      const parsed = new URL(configured);
      const hostname = parsed.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const ip = this.getLocalIp();
        if (ip) {
          const port = parsed.port ? `:${parsed.port}` : '';
          return `${parsed.protocol}//${ip}${port}`;
        }
      }
      return configured;
    } catch (e) {
      const ip = this.getLocalIp();
      if (ip) return `http://${ip}:3000`;
      return 'http://localhost:3000';
    }
  }

  private getLocalIp(): string | null {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      const net = nets[name];
      if (!net) continue;
      for (const ni of net) {
        if ((ni as any).family === 'IPv4' && !(ni as any).internal) {
          return (ni as any).address;
        }
      }
    }
    return null;
  }

  getLocalPath(storageKey: string) {
    const normalized = normalize(storageKey).replace(/^(\.\.[/\\])+/, '');
    return join(this.localDir, normalized);
  }

  createReadStream(storageKey: string) {
    return createReadStream(this.getLocalPath(storageKey));
  }
}
