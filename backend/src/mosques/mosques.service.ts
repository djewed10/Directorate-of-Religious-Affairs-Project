import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, ilike, max, or, sql, sum } from 'drizzle-orm';
import { pageLimit } from '../common/pagination';
import { DB, type AppDb } from '../db/database.module';
import {
  aidRecords,
  associations,
  consumptionUpdates,
  documentTypes,
  documents,
  internalNotes,
  mosques,
  notifications,
  progressionUpdates,
} from '../db/schema';
import { CreateMosqueDto } from './dto/create-mosque.dto';
import { UpdateMosqueDto } from './dto/update-mosque.dto';

@Injectable()
export class MosquesService {
  constructor(@Inject(DB) private readonly db: AppDb) {}

  async list(query?: {
    q?: string;
    page?: number;
    limit?: number;
    status?: string;
    receivesFridayDonations?: string | boolean;
    activeOnly?: string | boolean;
  }) {
    const { limit, offset } = pageLimit(query?.page, query?.limit);
    const filters = [];
    if (query?.q) {
      const pattern = `%${query.q}%`;
      filters.push(
        or(
          ilike(mosques.officialCode, pattern),
          ilike(mosques.name, pattern),
          ilike(mosques.commune, pattern),
          ilike(associations.name, pattern),
        ),
      );
    }
    if (query?.status) filters.push(eq(mosques.mosqueStatus, query.status as never));
    if (query?.receivesFridayDonations !== undefined) {
      filters.push(eq(mosques.receivesFridayDonations, String(query.receivesFridayDonations) === 'true'));
    }
    if (query?.activeOnly !== false && query?.activeOnly !== 'false') {
      filters.push(eq(mosques.isActive, true));
    }

    return this.db
      .select({
        mosque: mosques,
        associationName: associations.name,
      })
      .from(mosques)
      .leftJoin(associations, eq(mosques.associationId, associations.id))
      .where(filters.length ? and(...filters) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(mosques.lastActivityAt), desc(mosques.createdAt));
  }

  async get(id: string) {
    const [row] = await this.db
      .select({
        mosque: mosques,
        association: associations,
      })
      .from(mosques)
      .leftJoin(associations, eq(mosques.associationId, associations.id))
      .where(eq(mosques.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Mosque not found');

    const [latestProgression] = await this.db
      .select()
      .from(progressionUpdates)
      .where(eq(progressionUpdates.mosqueId, id))
      .orderBy(desc(progressionUpdates.createdAt))
      .limit(1);
    const [latestConsumption] = await this.db
      .select()
      .from(consumptionUpdates)
      .where(eq(consumptionUpdates.mosqueId, id))
      .orderBy(desc(consumptionUpdates.createdAt))
      .limit(1);
    const [documentSummary] = await this.db
      .select({
        total: count(documents.id),
        expired: sql<number>`count(*) filter (where ${documents.expirationDate} is not null and ${documents.expirationDate} < current_date)`,
        expiringSoon: sql<number>`count(*) filter (where ${documents.expirationDate} is not null and ${documents.expirationDate} >= current_date and ${documents.expirationDate} <= current_date + interval '30 days')`,
        noExpiration: sql<number>`count(*) filter (where ${documents.expirationDate} is null)`,
      })
      .from(documents)
      .where(and(eq(documents.mosqueId, id), eq(documents.isActive, true)));
    const recentNotifications = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.mosqueId, id))
      .orderBy(desc(notifications.createdAt))
      .limit(5);

    return {
      ...row,
      latestProgression,
      latestConsumption,
      documentSummary,
      recentNotifications,
    };
  }

  async create(dto: CreateMosqueDto) {
    const existing = await this.db.select().from(mosques).where(eq(mosques.officialCode, dto.officialCode)).limit(1);
    if (existing[0]) throw new ConflictException('Official code already exists');
    const values = this.normalizeMosquePayload(dto);
    const [created] = await this.db
      .insert(mosques)
      .values({
        ...values,
        mosqueStatus: values.mosqueStatus ?? 'under_construction',
        receivesFridayDonations: values.receivesFridayDonations ?? true,
      })
      .returning();
    return created;
  }

  async update(id: string, dto: UpdateMosqueDto) {
    const values = this.normalizeMosquePayload(dto);
    const [updated] = await this.db
      .update(mosques)
      .set({ ...values, updatedAt: new Date(), lastActivityAt: new Date() })
      .where(eq(mosques.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Mosque not found');
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.db
      .update(mosques)
      .set({ isActive: false, updatedAt: new Date(), lastActivityAt: new Date() })
      .where(eq(mosques.id, id))
      .returning();
    if (!deleted) throw new NotFoundException('Mosque not found');
    return deleted;
  }

  async wallet(id: string) {
    await this.ensureExists(id);
    const rows = await this.db
      .select({
        document: documents,
        type: documentTypes,
      })
      .from(documents)
      .innerJoin(documentTypes, eq(documents.documentTypeId, documentTypes.id))
      .where(and(eq(documents.mosqueId, id), eq(documents.isActive, true)))
      .orderBy(desc(documents.isPinned), documentTypes.sortOrder, desc(documents.uploadedAt));

    const activeTypeIds = new Set(rows.map((row) => row.type.id));
    const requiredMissing = await this.db
      .select()
      .from(documentTypes)
      .where(and(eq(documentTypes.isActive, true), eq(documentTypes.isRequiredDefault, true)));

    return {
      pinned: rows.filter((row) => row.document.isPinned),
      valid: rows.filter((row) => row.document.expirationDate && row.document.expirationDate >= new Date().toISOString().slice(0, 10)),
      expiringSoon: rows.filter((row) => {
        if (!row.document.expirationDate) return false;
        const expiry = new Date(row.document.expirationDate);
        const soon = new Date();
        soon.setDate(soon.getDate() + 30);
        return expiry >= new Date() && expiry <= soon;
      }),
      expired: rows.filter((row) => row.document.expirationDate && row.document.expirationDate < new Date().toISOString().slice(0, 10)),
      noExpiration: rows.filter((row) => !row.document.expirationDate),
      missing: requiredMissing.filter((type) => !activeTypeIds.has(type.id)),
      all: rows,
    };
  }

  async notes(id: string) {
    await this.ensureExists(id);
    return this.db.select().from(internalNotes).where(eq(internalNotes.mosqueId, id)).orderBy(desc(internalNotes.createdAt));
  }

  async recalculateAidTotals(mosqueId: string) {
    const [stats] = await this.db
      .select({
        aidCount: count(aidRecords.id),
        totalAidAmount: sum(aidRecords.amount),
        lastAidDate: max(aidRecords.aidDate),
      })
      .from(aidRecords)
      .where(eq(aidRecords.mosqueId, mosqueId));

    await this.db
      .update(mosques)
      .set({
        aidCount: Number(stats?.aidCount ?? 0),
        totalAidAmount: String(stats?.totalAidAmount ?? 0) as never,
        lastAidDate: stats?.lastAidDate ?? null,
        updatedAt: new Date(),
        lastActivityAt: new Date(),
      })
      .where(eq(mosques.id, mosqueId));
  }

  async recalculateConsumptionTotals(mosqueId: string) {
    const [stats] = await this.db
      .select({ totalConsumedAmount: sum(consumptionUpdates.withdrawnAmount) })
      .from(consumptionUpdates)
      .where(eq(consumptionUpdates.mosqueId, mosqueId));

    await this.db
      .update(mosques)
      .set({
        totalConsumedAmount: String(stats?.totalConsumedAmount ?? 0) as never,
        updatedAt: new Date(),
        lastActivityAt: new Date(),
      })
      .where(eq(mosques.id, mosqueId));
  }

  async touch(mosqueId: string) {
    await this.db
      .update(mosques)
      .set({ lastActivityAt: new Date(), updatedAt: new Date() })
      .where(eq(mosques.id, mosqueId));
  }

  async ensureExists(id: string) {
    const [mosque] = await this.db.select().from(mosques).where(eq(mosques.id, id)).limit(1);
    if (!mosque) throw new NotFoundException('Mosque not found');
    return mosque;
  }

  private normalizeMosquePayload<T extends CreateMosqueDto | UpdateMosqueDto>(dto: T): T {
    const next = {
      ...dto,
      wilaya: 'وهران',
      addressText: normalizeOptionalText(dto.addressText),
      googleMapsUrl: normalizeOptionalText(dto.googleMapsUrl),
    };
    const status = next.mosqueStatus;
    if (status === 'completed' || status === 'neighborhood_no_friday') {
      next.currentProgressPercent = null as never;
      next.estimatedTotalProjectCost = null as never;
      next.estimatedCompletionCost = null as never;
    }
    return next as T;
  }
}

function normalizeOptionalText(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
