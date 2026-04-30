import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, inArray } from 'drizzle-orm';
import type { AuthUser } from '../common/types';
import { DB, type AppDb } from '../db/database.module';
import { progressionMedia, progressionUpdates } from '../db/schema';
import { MosquesService } from '../mosques/mosques.service';
import { CreateProgressionDto } from './dto/create-progression.dto';

@Injectable()
export class ProgressionService {
  constructor(
    @Inject(DB) private readonly db: AppDb,
    private readonly mosquesService: MosquesService,
  ) {}

  async list(mosqueId?: string) {
    const updates = await this.db
      .select()
      .from(progressionUpdates)
      .where(mosqueId ? eq(progressionUpdates.mosqueId, mosqueId) : undefined)
      .orderBy(desc(progressionUpdates.createdAt))
      .limit(100);
    if (!updates.length) return [];
    const media = await this.db
      .select()
      .from(progressionMedia)
      .where(inArray(progressionMedia.progressionUpdateId, updates.map((update) => update.id)));
    return updates.map((update) => ({
      ...update,
      media: media.filter((item) => item.progressionUpdateId === update.id),
    }));
  }

  async create(dto: CreateProgressionDto, user?: AuthUser | null) {
    await this.mosquesService.ensureExists(dto.mosqueId);
    const [created] = await this.db
      .insert(progressionUpdates)
      .values({
        mosqueId: dto.mosqueId,
        sourceKind: dto.sourceKind ?? 'internal',
        stageCode: dto.stageCode ?? null,
        progressPercent: dto.progressPercent ?? null,
        shortNote: dto.shortNote ?? null,
        createdByUserId: user?.sub ?? null,
        externalRequestId: dto.externalRequestId ?? null,
      })
      .returning();
    if (dto.media?.length) {
      await this.db.insert(progressionMedia).values(
        dto.media.map((item, index) => ({
          progressionUpdateId: created.id,
          fileKind: item.fileKind,
          storageKey: item.storageKey,
          mimeType: item.mimeType,
          fileSize: item.fileSize,
          sortOrder: item.sortOrder ?? index,
          autoTitle: item.autoTitle ?? `تقدم الأشغال - ${index + 1}`,
        })),
      );
    }
    if (dto.progressPercent !== undefined) {
      await this.mosquesService.update(dto.mosqueId, { currentProgressPercent: dto.progressPercent });
    } else {
      await this.mosquesService.touch(dto.mosqueId);
    }
    return this.list(dto.mosqueId).then((rows) => rows.find((row) => row.id === created.id) ?? created);
  }
}

