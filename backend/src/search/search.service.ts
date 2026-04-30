import { Inject, Injectable } from '@nestjs/common';
import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { pageLimit } from '../common/pagination';
import { DB, type AppDb } from '../db/database.module';
import { associations, documentTypes, documents, mosques } from '../db/schema';

@Injectable()
export class SearchService {
  constructor(@Inject(DB) private readonly db: AppDb) {}

  async search(query: {
    q?: string;
    filter?: string;
    status?: string;
    documentTypeId?: string;
    page?: number;
    limit?: number;
  }) {
    const { limit, offset } = pageLimit(query.page, query.limit);
    const filters = [eq(mosques.isActive, true)];
    if (query.q) {
      const pattern = `%${query.q}%`;
      filters.push(
        or(
          ilike(mosques.officialCode, pattern),
          ilike(mosques.name, pattern),
          ilike(mosques.commune, pattern),
          ilike(associations.name, pattern),
          ilike(documentTypes.labelAr, pattern),
        )!,
      );
    }
    if (query.status) filters.push(eq(mosques.mosqueStatus, query.status as never));
    if (query.documentTypeId) filters.push(eq(documents.documentTypeId, query.documentTypeId));
    if (query.filter === 'expired_documents') {
      filters.push(sql`${documents.expirationDate} is not null and ${documents.expirationDate} < current_date`);
    }
    if (query.filter === 'expiring_soon') {
      filters.push(sql`${documents.expirationDate} is not null and ${documents.expirationDate} between current_date and current_date + interval '30 days'`);
    }
    if (query.filter === 'needs_progress_update' || query.filter === 'no_update_two_months') {
      filters.push(sql`${mosques.lastActivityAt} < now() - interval '60 days'`);
    }
    if (query.filter === 'old_last_aid') {
      filters.push(sql`${mosques.lastAidDate} is null or ${mosques.lastAidDate} < current_date - interval '2 years'`);
    }
    if (query.filter === 'under_construction') filters.push(eq(mosques.mosqueStatus, 'under_construction'));
    if (query.filter === 'renovation') filters.push(eq(mosques.mosqueStatus, 'renovation'));
    if (query.filter === 'completed') filters.push(eq(mosques.mosqueStatus, 'completed'));
    if (query.filter === 'neighborhood_no_friday') filters.push(eq(mosques.mosqueStatus, 'neighborhood_no_friday'));
    if (query.filter === 'receives_friday') filters.push(eq(mosques.receivesFridayDonations, true));
    if (query.filter === 'no_friday') filters.push(eq(mosques.receivesFridayDonations, false));

    return this.db
      .select({
        mosque: mosques,
        associationName: associations.name,
      })
      .from(mosques)
      .leftJoin(associations, eq(mosques.associationId, associations.id))
      .leftJoin(documents, eq(documents.mosqueId, mosques.id))
      .leftJoin(documentTypes, eq(documents.documentTypeId, documentTypes.id))
      .where(and(...filters))
      .groupBy(mosques.id, associations.name)
      .limit(limit)
      .offset(offset);
  }
}

