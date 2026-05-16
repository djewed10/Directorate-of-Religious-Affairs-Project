import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, inArray, lte, or, sql } from 'drizzle-orm';
import { DB, type AppDb } from '../db/database.module';
import { documentTypes, documents, externalUpdateRequests, mosques, notifications, users } from '../db/schema';
import { ExpoPushService } from './expo-push.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @Inject(DB) private readonly db: AppDb,
    private readonly config: ConfigService,
    private readonly expoPush: ExpoPushService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async dailyMaintenance() {
    await this.createDocumentExpirationNotifications();
    await this.createInactivityNotifications();
    await this.expireExternalRequests();
    await this.cleanupTrash();
  }

  async createDocumentExpirationNotifications() {
    const days = this.config.get<number>('EXPIRING_SOON_DAYS', 30);
    
    // Find documents we already notified for "soon" to avoid spam
    const alreadySoonRows = await this.db.execute(sql`SELECT metadata_json->>'documentId' as doc_id FROM notifications WHERE type = 'document_expiring_soon'`);
    const alreadySoonArray = Array.isArray(alreadySoonRows) ? alreadySoonRows : (alreadySoonRows as any).rows || [];
    const alreadySoon = new Set(alreadySoonArray.map((r: any) => r.doc_id));

    // Find documents we already notified for "expired" to avoid spam
    const alreadyExpiredRows = await this.db.execute(sql`SELECT metadata_json->>'documentId' as doc_id FROM notifications WHERE type = 'document_expired'`);
    const alreadyExpiredArray = Array.isArray(alreadyExpiredRows) ? alreadyExpiredRows : (alreadyExpiredRows as any).rows || [];
    const alreadyExpired = new Set(alreadyExpiredArray.map((r: any) => r.doc_id));

    const soonRows = await this.db
      .select({ document: documents, documentType: documentTypes, mosque: mosques })
      .from(documents)
      .innerJoin(mosques, eq(documents.mosqueId, mosques.id))
      .innerJoin(documentTypes, eq(documents.documentTypeId, documentTypes.id))
      .where(
        and(
          eq(documents.isActive, true),
          sql`${documents.expirationDate} is not null`,
          sql`${documents.expirationDate} between current_date and current_date + (${days} || ' days')::interval`,
        ),
      )
      .limit(500);

    const expiredRows = await this.db
      .select({ document: documents, documentType: documentTypes, mosque: mosques })
      .from(documents)
      .innerJoin(mosques, eq(documents.mosqueId, mosques.id))
      .innerJoin(documentTypes, eq(documents.documentTypeId, documentTypes.id))
      .where(and(eq(documents.isActive, true), sql`${documents.expirationDate} is not null`, sql`${documents.expirationDate} < current_date`))
      .limit(500);

    const staff = await this.staffUsers();
    let soonNotifiedCount = 0;
    let expiredNotifiedCount = 0;

    for (const row of soonRows) {
      if (alreadySoon.has(row.document.id)) continue;
      await this.notifyStaff(staff, {
        mosqueId: row.mosque.id,
        type: 'document_expiring_soon',
        titleAr: `${row.documentType.labelAr} ستنتهي قريبًا`,
        bodyAr: `${row.mosque.name} - رقم ${row.mosque.officialCode} - بلدية ${row.mosque.commune} لديه ${row.documentType.labelAr} ستنتهي قريبًا.`,
        metadataJson: {
          targetType: 'document_expiring',
          mosqueId: row.mosque.id,
          documentId: row.document.id,
          documentTypeId: row.documentType.id,
          documentTypeLabelAr: row.documentType.labelAr,
        },
      });
      soonNotifiedCount++;
    }

    for (const row of expiredRows) {
      if (alreadyExpired.has(row.document.id)) continue;
      await this.notifyStaff(staff, {
        mosqueId: row.mosque.id,
        type: 'document_expired',
        titleAr: `${row.documentType.labelAr} منتهية`,
        bodyAr: `${row.mosque.name} - رقم ${row.mosque.officialCode} - بلدية ${row.mosque.commune} لديه ${row.documentType.labelAr} منتهية.`,
        metadataJson: {
          targetType: 'document_expired',
          mosqueId: row.mosque.id,
          documentId: row.document.id,
          documentTypeId: row.documentType.id,
          documentTypeLabelAr: row.documentType.labelAr,
        },
      });
      expiredNotifiedCount++;
    }
    this.logger.log(`Expiration notifications triggered: soon=${soonNotifiedCount}/${soonRows.length}, expired=${expiredNotifiedCount}/${expiredRows.length}`);
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
        metadataJson: {
          targetType: 'mosque_inactive',
          mosqueId: mosque.id,
          days,
        },
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

  /**
   * Debug method: Send a test notification to a specific user (for testing push notification pipeline)
   */
  async sendTestNotificationToUser(userId: string) {
    this.logger.log(`[TEST] Creating test notification for userId: ${userId}`);
    
    const [created] = await this.db
      .insert(notifications)
      .values({
        userId,
        type: 'test',
        titleAr: 'اختبار التنبيهات',
        bodyAr: 'هذا تنبيه اختبار من backend للتحقق من pipeline الإرسال',
        metadataJson: { test: true, targetType: 'mosque_inactive' },
      })
      .returning();

    this.logger.log(`[TEST] ✓ Test notification created: ${created.id}`);
    
    // Send push immediately
    this.logger.log(`[TEST] Triggering push send for test notification`);
    await this.expoPush.sendPushForNotification(created.id);
    
    return created;
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
    if (!staff.length) {
      this.logger.log(`[NOTIFY] No staff members found, skipping notification`);
      return;
    }
    
    this.logger.log(`[NOTIFY] Creating notification for ${staff.length} staff member(s) - Type: ${payload.type}`);
    
    const created = await this.db.insert(notifications).values(
      staff.map((user) => ({
        ...payload,
        userId: user.id,
        metadataJson: payload.metadataJson ?? {},
      })),
    ).returning();
    
    this.logger.log(`[NOTIFY] ✓ Created ${created.length} notification(s) in database`);
    
    // Send push notifications for each created notification
    for (const notif of created) {
      this.logger.log(`[NOTIFY] Triggering push send for notification ${notif.id} (userId: ${notif.userId})`);
      await this.expoPush.sendPushForNotification(notif.id);
    }
  }
}
