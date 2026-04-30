import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, inArray } from 'drizzle-orm';
import type { AuthUser } from '../common/types';
import { DB, type AppDb } from '../db/database.module';
import { consumptionMedia, consumptionUpdates } from '../db/schema';
import { MosquesService } from '../mosques/mosques.service';
import { CreateConsumptionDto } from './dto/create-consumption.dto';

@Injectable()
export class ConsumptionService {
  constructor(
    @Inject(DB) private readonly db: AppDb,
    private readonly mosquesService: MosquesService,
  ) {}

  async list(mosqueId?: string) {
    const updates = await this.db
      .select()
      .from(consumptionUpdates)
      .where(mosqueId ? eq(consumptionUpdates.mosqueId, mosqueId) : undefined)
      .orderBy(desc(consumptionUpdates.createdAt))
      .limit(100);
    if (!updates.length) return [];
    const media = await this.db
      .select()
      .from(consumptionMedia)
      .where(inArray(consumptionMedia.consumptionUpdateId, updates.map((update) => update.id)));
    return updates.map((update) => ({
      ...update,
      media: media.filter((item) => item.consumptionUpdateId === update.id),
      hasCheque: media.some((item) => item.consumptionUpdateId === update.id && item.mediaType === 'cheque_image'),
      proofCount: media.filter((item) => item.consumptionUpdateId === update.id).length,
    }));
  }

  async create(dto: CreateConsumptionDto, user?: AuthUser | null) {
    await this.mosquesService.ensureExists(dto.mosqueId);
    const [created] = await this.db
      .insert(consumptionUpdates)
      .values({
        mosqueId: dto.mosqueId,
        aidRecordId: dto.aidRecordId ?? null,
        sourceKind: dto.sourceKind ?? 'internal',
        consumptionCategoryCode: dto.consumptionCategoryCode ?? null,
        withdrawnAmount: dto.withdrawnAmount ?? null,
        shortNote: dto.shortNote ?? null,
        optionalProgressPercent: dto.optionalProgressPercent ?? null,
        createdByUserId: user?.sub ?? null,
        externalRequestId: dto.externalRequestId ?? null,
      })
      .returning();
    if (dto.media?.length) {
      await this.db.insert(consumptionMedia).values(
        dto.media.map((item, index) => ({
          consumptionUpdateId: created.id,
          fileKind: item.fileKind,
          mediaType: item.mediaType,
          storageKey: item.storageKey,
          mimeType: item.mimeType,
          fileSize: item.fileSize,
          sortOrder: item.sortOrder ?? index,
          autoTitle: item.autoTitle ?? `استهلاك - ${index + 1}`,
        })),
      );
    }
    await this.mosquesService.recalculateConsumptionTotals(dto.mosqueId);
    if (dto.optionalProgressPercent !== undefined) {
      await this.mosquesService.update(dto.mosqueId, { currentProgressPercent: dto.optionalProgressPercent });
    }
    return this.list(dto.mosqueId).then((rows) => rows.find((row) => row.id === created.id) ?? created);
  }
}

