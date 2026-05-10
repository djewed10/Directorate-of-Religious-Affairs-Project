import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq, inArray } from 'drizzle-orm';
import { pageLimit } from '../common/pagination';
import type { AuthUser } from '../common/types';
import { DB, type AppDb } from '../db/database.module';
import { progressionMedia, progressionUpdates } from '../db/schema';
import { MosquesService } from '../mosques/mosques.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateProgressionDto } from './dto/create-progression.dto';
import { UpdateProgressionDto } from './dto/update-progression.dto';

@Injectable()
export class ProgressionService {
  constructor(
    @Inject(DB) private readonly db: AppDb,
    private readonly mosquesService: MosquesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async list(query?: { mosqueId?: string; page?: number; limit?: number } | string) {
    const mosqueId = typeof query === 'string' ? query : query?.mosqueId;
    const { limit, offset } = pageLimit(typeof query === 'string' ? undefined : query?.page, typeof query === 'string' ? 30 : (query?.limit ?? 30));
    const updates = await this.db
      .select()
      .from(progressionUpdates)
      .where(mosqueId ? eq(progressionUpdates.mosqueId, mosqueId) : undefined)
      .orderBy(desc(progressionUpdates.createdAt))
      .limit(limit)
      .offset(offset);
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

  async get(id: string) {
    const [update] = await this.db.select().from(progressionUpdates).where(eq(progressionUpdates.id, id)).limit(1);
    if (!update) throw new NotFoundException('Progression update not found');
    const media = await this.db.select().from(progressionMedia).where(eq(progressionMedia.progressionUpdateId, id));
    return { ...update, media };
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

    if (user?.sub) {
      await this.notificationsService.create({
        userId: user.sub,
        mosqueId: dto.mosqueId,
        type: 'progression_update',
        titleAr: 'تحديث تقدم الأشغال',
        bodyAr: 'تم تسجيل تحديث جديد لتقدم الأشغال.',
        metadataJson: {
          targetType: 'progression_update',
          mosqueId: dto.mosqueId,
          progressionId: created.id,
        },
      });
    }

    return this.get(created.id);
  }

  async update(id: string, dto: UpdateProgressionDto) {
    const current = await this.get(id);
    const [updated] = await this.db
      .update(progressionUpdates)
      .set({
        stageCode: dto.stageCode ?? current.stageCode,
        progressPercent: dto.progressPercent === undefined ? current.progressPercent : dto.progressPercent,
        shortNote: dto.shortNote === undefined ? current.shortNote : dto.shortNote,
        updatedAt: new Date(),
      })
      .where(eq(progressionUpdates.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Progression update not found');
    if (dto.media?.length) {
      await this.db.insert(progressionMedia).values(
        dto.media.map((item, index) => ({
          progressionUpdateId: id,
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
      await this.mosquesService.update(updated.mosqueId, { currentProgressPercent: dto.progressPercent });
    } else {
      await this.mosquesService.touch(updated.mosqueId);
    }
    return this.get(id);
  }

  async delete(id: string) {
    const [deleted] = await this.db.delete(progressionUpdates).where(eq(progressionUpdates.id, id)).returning();
    if (!deleted) throw new NotFoundException('Progression update not found');
    await this.mosquesService.touch(deleted.mosqueId);
    return deleted;
  }

  async deleteMedia(id: string) {
    const [deleted] = await this.db.delete(progressionMedia).where(eq(progressionMedia.id, id)).returning();
    if (!deleted) throw new NotFoundException('Progression media not found');
    return deleted;
  }
}
