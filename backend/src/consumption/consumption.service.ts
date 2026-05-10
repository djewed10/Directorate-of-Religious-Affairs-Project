import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq, inArray } from 'drizzle-orm';
import { pageLimit } from '../common/pagination';
import type { AuthUser } from '../common/types';
import { DB, type AppDb } from '../db/database.module';
import { consumptionMedia, consumptionUpdates } from '../db/schema';
import { MosquesService } from '../mosques/mosques.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateConsumptionDto } from './dto/create-consumption.dto';
import { UpdateConsumptionDto } from './dto/update-consumption.dto';

@Injectable()
export class ConsumptionService {
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
      .from(consumptionUpdates)
      .where(mosqueId ? eq(consumptionUpdates.mosqueId, mosqueId) : undefined)
      .orderBy(desc(consumptionUpdates.createdAt))
      .limit(limit)
      .offset(offset);
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

  async get(id: string) {
    const [update] = await this.db.select().from(consumptionUpdates).where(eq(consumptionUpdates.id, id)).limit(1);
    if (!update) throw new NotFoundException('Consumption update not found');
    const media = await this.db.select().from(consumptionMedia).where(eq(consumptionMedia.consumptionUpdateId, id));
    return {
      ...update,
      media,
      hasCheque: media.some((item) => item.mediaType === 'cheque_image'),
      proofCount: media.length,
    };
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

    if (user?.sub) {
      await this.notificationsService.create({
        userId: user.sub,
        mosqueId: dto.mosqueId,
        type: 'consumption_update',
        titleAr: 'تحديث الاستهلاك',
        bodyAr: 'تم تسجيل تحديث جديد للاستهلاك.',
        metadataJson: {
          targetType: 'consumption_update',
          mosqueId: dto.mosqueId,
          consumptionId: created.id,
        },
      });
    }

    return this.get(created.id);
  }

  async update(id: string, dto: UpdateConsumptionDto) {
    const current = await this.get(id);
    const [updated] = await this.db
      .update(consumptionUpdates)
      .set({
        aidRecordId: dto.aidRecordId === undefined ? current.aidRecordId : dto.aidRecordId,
        consumptionCategoryCode:
          dto.consumptionCategoryCode === undefined ? current.consumptionCategoryCode : dto.consumptionCategoryCode,
        withdrawnAmount: dto.withdrawnAmount === undefined ? current.withdrawnAmount : dto.withdrawnAmount,
        shortNote: dto.shortNote === undefined ? current.shortNote : dto.shortNote,
        optionalProgressPercent:
          dto.optionalProgressPercent === undefined ? current.optionalProgressPercent : dto.optionalProgressPercent,
        updatedAt: new Date(),
      })
      .where(eq(consumptionUpdates.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Consumption update not found');
    if (dto.media?.length) {
      await this.db.insert(consumptionMedia).values(
        dto.media.map((item, index) => ({
          consumptionUpdateId: id,
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
    await this.mosquesService.recalculateConsumptionTotals(updated.mosqueId);
    if (dto.optionalProgressPercent !== undefined) {
      await this.mosquesService.update(updated.mosqueId, { currentProgressPercent: dto.optionalProgressPercent });
    }
    return this.get(id);
  }

  async delete(id: string) {
    const [deleted] = await this.db.delete(consumptionUpdates).where(eq(consumptionUpdates.id, id)).returning();
    if (!deleted) throw new NotFoundException('Consumption update not found');
    await this.mosquesService.recalculateConsumptionTotals(deleted.mosqueId);
    return deleted;
  }

  async deleteMedia(id: string) {
    const [deleted] = await this.db.delete(consumptionMedia).where(eq(consumptionMedia.id, id)).returning();
    if (!deleted) throw new NotFoundException('Consumption media not found');
    return deleted;
  }
}
