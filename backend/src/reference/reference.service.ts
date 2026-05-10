import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, ilike, isNotNull, sql } from 'drizzle-orm';
import { DB, type AppDb } from '../db/database.module';
import { associations, consumptionCategories, mosqueStatuses, mosques, ocrConfigs, progressionStages } from '../db/schema';

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

  async suggestions(field: string, q?: string) {
    const pattern = `%${q ?? ''}%`;
    const limit = 12;
    if (field === 'association') {
      const rows = await this.db
        .select({ value: associations.name })
        .from(associations)
        .where(q ? ilike(associations.name, pattern) : undefined)
        .orderBy(asc(associations.name))
        .limit(limit);
      return rows.map((row) => row.value);
    }

    const column =
      field === 'commune'
        ? mosques.commune
        : field === 'daira'
          ? mosques.daira
          : field === 'address'
            ? mosques.address
            : field === 'classification'
              ? mosques.classification
              : null;
    if (!column) return [];
    const rows = await this.db
      .select({ value: column })
      .from(mosques)
      .where(q ? ilike(column, pattern) : isNotNull(column))
      .groupBy(column)
      .orderBy(sql`count(*) desc`, asc(column))
      .limit(limit);
    return rows.map((row) => row.value).filter(Boolean);
  }
}
