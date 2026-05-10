import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNotNull, isNull, lte, or, sql } from 'drizzle-orm';
import { ConfigService } from '@nestjs/config';
import { DB, type AppDb } from '../db/database.module';
import {
  consumptionMedia,
  consumptionUpdates,
  documentTypes,
  documents,
  mosques,
  progressionUpdates,
} from '../db/schema';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DB) private readonly db: AppDb,
    private readonly config: ConfigService,
  ) {}

  async summary() {
    const expiringDays = this.config.get<number>('EXPIRING_SOON_DAYS', 30);
    const inactivityDays = this.config.get<number>('INACTIVITY_DAYS', 60);
    const soonSql = sql`current_date + (${expiringDays} || ' days')::interval`;
    const inactiveSql = sql`now() - (${inactivityDays} || ' days')::interval`;
    const activeMosque = or(
      eq(mosques.mosqueStatus, 'under_construction'),
      eq(mosques.mosqueStatus, 'renovation'),
      eq(mosques.receivesFridayDonations, true),
    );

    const [docStats] = await this.db
      .select({
        expired: sql<number>`count(*) filter (where ${documents.expirationDate} is not null and ${documents.expirationDate} < current_date)`,
        expiringSoon: sql<number>`count(*) filter (where ${documents.expirationDate} is not null and ${documents.expirationDate} >= current_date and ${documents.expirationDate} <= ${soonSql})`,
        total: count(documents.id),
      })
      .from(documents)
      .where(eq(documents.isActive, true));

    const [moneyStats] = await this.db
      .select({
        totalAidAmount: sql<number>`coalesce(sum(${mosques.totalAidAmount}), 0)`,
        totalConsumedAmount: sql<number>`coalesce(sum(${mosques.totalConsumedAmount}), 0)`,
        estimatedCompletionCost: sql<number>`coalesce(sum(${mosques.estimatedCompletionCost}), 0)`,
      })
      .from(mosques)
      .where(eq(mosques.isActive, true));

    const statuses = await this.db
      .select({
        mosqueStatus: mosques.mosqueStatus,
        count: count(mosques.id),
      })
      .from(mosques)
      .where(eq(mosques.isActive, true))
      .groupBy(mosques.mosqueStatus);

    const latestProgression = await this.db
      .select({
        update: progressionUpdates,
        mosqueName: mosques.name,
        officialCode: mosques.officialCode,
        commune: mosques.commune,
      })
      .from(progressionUpdates)
      .innerJoin(mosques, eq(progressionUpdates.mosqueId, mosques.id))
      .orderBy(desc(progressionUpdates.createdAt))
      .limit(8);

    const latestConsumption = await this.db
      .select({
        update: consumptionUpdates,
        mosqueName: mosques.name,
        officialCode: mosques.officialCode,
        commune: mosques.commune,
      })
      .from(consumptionUpdates)
      .innerJoin(mosques, eq(consumptionUpdates.mosqueId, mosques.id))
      .orderBy(desc(consumptionUpdates.createdAt))
      .limit(8);

    const latestDocuments = await this.db
      .select({
        document: documents,
        documentTypeLabel: documentTypes.labelAr,
        mosqueName: mosques.name,
        officialCode: mosques.officialCode,
        commune: mosques.commune,
      })
      .from(documents)
      .innerJoin(mosques, eq(documents.mosqueId, mosques.id))
      .innerJoin(documentTypes, eq(documents.documentTypeId, documentTypes.id))
      .where(eq(documents.isActive, true))
      .orderBy(desc(documents.uploadedAt))
      .limit(8);

    const lastAidMosque = await this.db
      .select()
      .from(mosques)
      .where(isNotNull(mosques.lastAidDate))
      .orderBy(desc(mosques.lastAidDate))
      .limit(1);

    const topNeedFollowUp = await this.db
      .select()
      .from(mosques)
      .where(and(eq(mosques.isActive, true), activeMosque, lte(mosques.lastActivityAt, inactiveSql)))
      .orderBy(mosques.lastActivityAt)
      .limit(5);

    const topExpiredDocuments = await this.db
      .select({
        mosqueId: mosques.id,
        name: mosques.name,
        officialCode: mosques.officialCode,
        commune: mosques.commune,
        expiredCount: count(documents.id),
      })
      .from(mosques)
      .innerJoin(documents, eq(documents.mosqueId, mosques.id))
      .where(and(eq(documents.isActive, true), isNotNull(documents.expirationDate), lte(documents.expirationDate, sql`current_date`)))
      .groupBy(mosques.id)
      .orderBy(desc(count(documents.id)))
      .limit(5);

    const topRecentActivity = await this.db
      .select()
      .from(mosques)
      .where(eq(mosques.isActive, true))
      .orderBy(desc(mosques.lastActivityAt))
      .limit(5);

    const consumptionWithoutProof = await this.db
      .select({
        mosqueId: mosques.id,
        name: mosques.name,
        officialCode: mosques.officialCode,
        commune: mosques.commune,
        count: count(consumptionUpdates.id),
      })
      .from(consumptionUpdates)
      .innerJoin(mosques, eq(consumptionUpdates.mosqueId, mosques.id))
      .leftJoin(consumptionMedia, eq(consumptionMedia.consumptionUpdateId, consumptionUpdates.id))
      .where(isNull(consumptionMedia.id))
      .groupBy(mosques.id)
      .limit(5);

    return {
      cards: {
        expiredDocuments: Number(docStats?.expired ?? 0),
        expiringSoonDocuments: Number(docStats?.expiringSoon ?? 0),
        totalDocuments: Number(docStats?.total ?? 0),
        totalAidAmount: Number(moneyStats?.totalAidAmount ?? 0),
        totalConsumedAmount: Number(moneyStats?.totalConsumedAmount ?? 0),
        estimatedCompletionCost: Number(moneyStats?.estimatedCompletionCost ?? 0),
        remainingEstimate:
          Number(moneyStats?.estimatedCompletionCost ?? 0) - Number(moneyStats?.totalConsumedAmount ?? 0),
        underConstruction: Number(statuses.find((item) => item.mosqueStatus === 'under_construction')?.count ?? 0),
        renovation: Number(statuses.find((item) => item.mosqueStatus === 'renovation')?.count ?? 0),
        completed: Number(statuses.find((item) => item.mosqueStatus === 'completed')?.count ?? 0),
        neighborhoodNoFriday: Number(statuses.find((item) => item.mosqueStatus === 'neighborhood_no_friday')?.count ?? 0),
      },
      latestProgression,
      latestConsumption,
      latestDocuments,
      lastAidMosque: lastAidMosque[0] ?? null,
      top: {
        needFollowUp: topNeedFollowUp,
        expiredDocuments: topExpiredDocuments,
        recentActivity: topRecentActivity,
        noUpdateSincePeriod: topNeedFollowUp,
        consumptionWithoutEnoughProof: consumptionWithoutProof,
      },
    };
  }
}
