import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { pageLimit } from '../common/pagination';
import { DB, type AppDb } from '../db/database.module';
import { aidRecords } from '../db/schema';
import { MosquesService } from '../mosques/mosques.service';
import { CreateAidRecordDto } from './dto/create-aid-record.dto';
import { UpdateAidRecordDto } from './dto/update-aid-record.dto';

@Injectable()
export class AidRecordsService {
  constructor(
    @Inject(DB) private readonly db: AppDb,
    private readonly mosquesService: MosquesService,
  ) {}

  async list(query?: { mosqueId?: string; page?: number; limit?: number } | string) {
    const mosqueId = typeof query === 'string' ? query : query?.mosqueId;
    const { limit, offset } = pageLimit(typeof query === 'string' ? undefined : query?.page, typeof query === 'string' ? 30 : (query?.limit ?? 30));
    return this.db
      .select()
      .from(aidRecords)
      .where(mosqueId ? eq(aidRecords.mosqueId, mosqueId) : undefined)
      .orderBy(desc(aidRecords.aidDate), desc(aidRecords.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async get(id: string) {
    const [record] = await this.db.select().from(aidRecords).where(eq(aidRecords.id, id)).limit(1);
    if (!record) throw new NotFoundException('Aid record not found');
    return record;
  }

  async create(dto: CreateAidRecordDto) {
    await this.mosquesService.ensureExists(dto.mosqueId);
    const [created] = await this.db.insert(aidRecords).values(dto).returning();
    await this.mosquesService.recalculateAidTotals(dto.mosqueId);
    return created;
  }

  async update(id: string, dto: UpdateAidRecordDto) {
    const [current] = await this.db.select().from(aidRecords).where(eq(aidRecords.id, id)).limit(1);
    if (!current) throw new NotFoundException('Aid record not found');
    const [updated] = await this.db
      .update(aidRecords)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(aidRecords.id, id))
      .returning();
    await this.mosquesService.recalculateAidTotals(dto.mosqueId ?? current.mosqueId);
    if (dto.mosqueId && dto.mosqueId !== current.mosqueId) {
      await this.mosquesService.recalculateAidTotals(current.mosqueId);
    }
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.db.delete(aidRecords).where(eq(aidRecords.id, id)).returning();
    if (!deleted) throw new NotFoundException('Aid record not found');
    await this.mosquesService.recalculateAidTotals(deleted.mosqueId);
    return deleted;
  }
}
