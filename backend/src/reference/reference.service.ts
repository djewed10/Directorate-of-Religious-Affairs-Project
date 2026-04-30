import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DB, type AppDb } from '../db/database.module';
import { consumptionCategories, mosqueStatuses, ocrConfigs, progressionStages } from '../db/schema';

@Injectable()
export class ReferenceService {
  constructor(@Inject(DB) private readonly db: AppDb) {}

  async all() {
    const [statuses, stages, categories, ocrConfig] = await Promise.all([
      this.db.select().from(mosqueStatuses).where(eq(mosqueStatuses.isActive, true)).orderBy(asc(mosqueStatuses.sortOrder)),
      this.db.select().from(progressionStages).where(eq(progressionStages.isActive, true)).orderBy(asc(progressionStages.sortOrder)),
      this.db
        .select()
        .from(consumptionCategories)
        .where(eq(consumptionCategories.isActive, true))
        .orderBy(asc(consumptionCategories.sortOrder)),
      this.db.select().from(ocrConfigs).where(eq(ocrConfigs.isActive, true)).limit(1),
    ]);
    return { statuses, stages, categories, ocrConfig: ocrConfig[0] ?? null };
  }
}

