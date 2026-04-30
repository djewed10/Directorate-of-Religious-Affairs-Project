import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, inArray, lte, or, sql } from 'drizzle-orm';
import { DB, type AppDb } from '../db/database.module';
import { documents, externalUpdateRequests, mosques, notifications, users } from '../db/schema';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @Inject(DB) private readonly db: AppDb,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async dailyMaintenance() {
    await this.createDocumentExpirationNotifications();
    await this.createInactivityNotifications();
    await this.expireExternalRequests();
    await this.cleanupTrash();
  }

  async createDocumentExpirationNotifications() {
    const days = this.config.get<number>('EXPIRING_SOON_DAYS', 30);
    const soonRows = await this.db
      .select({ document: documents, mosque: mosques })
      .from(documents)
      .innerJoin(mosques, eq(documents.mosqueId, mosques.id))
      .where(
        and(
          eq(documents.isActive, true),
          sql`${documents.expirationDate} is not null`,
          sql`${documents.expirationDate} between current_date and current_date + (${days} || ' days')::interval`,
        ),
      )
      .limit(200);
    const expiredRows = await this.db
      .select({ document: documents, mosque: mosques })
      .from(documents)
      .innerJoin(mosques, eq(documents.mosqueId, mosques.id))
      .where(and(eq(documents.isActive, true), sql`${documents.expirationDate} is not null`, sql`${documents.expirationDate} < current_date`))
      .limit(200);

    const staff = await this.staffUsers();
    for (const row of soonRows) {
      await this.notifyStaff(staff, {
        mosqueId: row.mosque.id,
        type: 'document_expiring_soon',
        titleAr: 'وثيقة ستنتهي قريبًا',
        bodyAr: `${row.mosque.name} - رقم ${row.mosque.officialCode} - بلدية ${row.mosque.commune} لديه وثيقة ستنتهي قريبًا.`,
        metadataJson: { documentId: row.document.id },
      });
    }
    for (const row of expiredRows) {
      await this.notifyStaff(staff, {
        mosqueId: row.mosque.id,
        type: 'document_expired',
        titleAr: 'وثيقة منتهية',
        bodyAr: `${row.mosque.name} - رقم ${row.mosque.officialCode} - بلدية ${row.mosque.commune} لديه وثيقة منتهية.`,
        metadataJson: { documentId: row.document.id },
      });
    }
    this.logger.log(`Expiration notifications checked: soon=${soonRows.length}, expired=${expiredRows.length}`);
  }

  async createInactivityNotifications() {
    const days = this.config.get<number>('INACTIVITY_DAYS', 60);
    const rows = await this.db
      .select()
      .from(mosques)
      .where(
        and(
          eq(mosques.isActive, true),
          or(eq(mosques.mosqueStatus, 'under_construction'), eq(mosques.mosqueStatus, 'renovation'), eq(mosques.receivesFridayDonations, true)),
          sql`${mosques.lastActivityAt} < now() - (${days} || ' days')::interval`,
        ),
      )
      .limit(200);
    const staff = await this.staffUsers();
    for (const mosque of rows) {
      await this.notifyStaff(staff, {
        mosqueId: mosque.id,
        type: 'mosque_inactive',
        titleAr: 'مسجد يحتاج متابعة',
        bodyAr: `${mosque.name} - رقم ${mosque.officialCode} - بلدية ${mosque.commune} لم يرسل تحديثًا منذ ${days} يومًا.`,
        metadataJson: { days },
      });
    }
  }

  async expireExternalRequests() {
    const expired = await this.db
      .update(externalUpdateRequests)
      .set({ status: 'expired' })
      .where(and(eq(externalUpdateRequests.status, 'pending'), lte(externalUpdateRequests.expiresAt, new Date())))
      .returning();
    if (expired.length) this.logger.log(`Expired external requests: ${expired.length}`);
  }

  async cleanupTrash() {
    const days = this.config.get<number>('TRASH_RETENTION_DAYS', 30);
    await this.db
      .delete(documents)
      .where(and(eq(documents.isActive, false), sql`${documents.deletedAt} < now() - (${days} || ' days')::interval`));
  }

  private staffUsers() {
    return this.db
      .select()
      .from(users)
      .where(and(eq(users.isActive, true), inArray(users.role, ['admin', 'manager', 'operator'])));
  }

  private async notifyStaff(
    staff: Array<typeof users.$inferSelect>,
    payload: Omit<typeof notifications.$inferInsert, 'userId'>,
  ) {
    if (!staff.length) return;
    await this.db.insert(notifications).values(
      staff.map((user) => ({
        ...payload,
        userId: user.id,
        metadataJson: payload.metadataJson ?? {},
      })),
    );
  }
}

