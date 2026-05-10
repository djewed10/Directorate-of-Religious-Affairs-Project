import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DB, type AppDb } from '../db/database.module';
import { mosques, notifications, pushTokens } from '../db/schema';
import { StorageService } from '../storage/storage.service';

interface ExpoPushMessage {
  to: string;
  sound?: string;
  title?: string;
  body?: string;
  data?: Record<string, string>;
  richContent?: { image: string };
}

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly expoApiUrl = 'https://exp.host/--/api/v2/push/send';

  constructor(
    @Inject(DB) private readonly db: AppDb,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Send push notifications to all registered tokens for a given notification
   */
  async sendPushForNotification(notificationId: string) {
    try {
      this.logger.log(`[PUSH] Starting push notification send for notification: ${notificationId}`);

      // Fetch the notification
      const notification = await this.db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (!notification.length) {
        this.logger.warn(`[PUSH] Notification not found: ${notificationId}`);
        return;
      }

      const notif = notification[0];
      this.logger.log(`[PUSH] Notification found - ID: ${notif.id}, Type: ${notif.type}, UserId: ${notif.userId}`);

      if (!notif.userId) {
        this.logger.debug(`[PUSH] Notification ${notificationId} has no userId, skipping push`);
        return;
      }

      // Find all active push tokens for this user
      this.logger.log(`[PUSH] Looking for active push tokens for userId: ${notif.userId}`);
      const tokens = await this.db
        .select()
        .from(pushTokens)
        .where(and(eq(pushTokens.userId, notif.userId), eq(pushTokens.isActive, true)));

      this.logger.log(`[PUSH] Found ${tokens.length} active push token(s) for userId ${notif.userId}`);

      if (!tokens.length) {
        this.logger.warn(`[PUSH] No active push tokens found for user ${notif.userId}`);
        return;
      }

      // Prepare messages
      const metadata = (notif.metadataJson ?? {}) as Record<string, unknown>;
      const stringData = Object.fromEntries(
        Object.entries(metadata)
          .filter(([, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)]),
      );
      const richImageUrl = await this.getMosqueRichImageUrl(notif.mosqueId);

      const messages = tokens.map((token: typeof pushTokens.$inferSelect): ExpoPushMessage => {
        // Rich images are best-effort; navigation data stays unchanged so notification taps keep working.
        const message = {
          to: token.expoPushToken,
          sound: 'default',
          title: notif.titleAr,
          body: notif.bodyAr,
          data: {
            notificationId: notif.id,
            type: notif.type,
            mosqueId: notif.mosqueId || '',
            ...stringData,
          },
          ...(richImageUrl ? { richContent: { image: richImageUrl } } : {}),
        };
        this.logger.log(`[PUSH] Prepared message for token ${token.expoPushToken.slice(0, 30)}... - Platform: ${token.platform}`);
        return message;
      });

      this.logger.log(`[PUSH] Sending ${messages.length} message(s) to Expo API...`);
      // Send to Expo
      await this.sendToExpo(messages);
      this.logger.log(`[PUSH] ✓ Successfully sent push notifications for notification ${notificationId} to ${tokens.length} device(s)`);
    } catch (error) {
      this.logger.error(`[PUSH] ✗ Failed to send push for notification ${notificationId}:`, error);
    }
  }

  private async getMosqueRichImageUrl(mosqueId?: string | null) {
    if (!mosqueId) return null;
    const [mosque] = await this.db
      .select({ coverImageStorageKey: mosques.coverImageStorageKey })
      .from(mosques)
      .where(eq(mosques.id, mosqueId))
      .limit(1);
    if (!mosque?.coverImageStorageKey) return null;

    const signed = await this.storageService.signViewUrl(mosque.coverImageStorageKey);
    if (!signed.url?.startsWith('https://')) return null;
    return signed.url;
  }

  /**
   * Send multiple push messages to Expo Push Service
   */
  private async sendToExpo(messages: ExpoPushMessage[]) {
    try {
      this.logger.log(`[PUSH] Sending batch of ${messages.length} message(s) to Expo Push Service at ${this.expoApiUrl}`);
      this.logger.debug(`[PUSH] Payload:`, JSON.stringify(messages, null, 2));

      const response = await fetch(this.expoApiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      this.logger.log(`[PUSH] Expo API response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`[PUSH] Expo API error (${response.status}): ${error}`);
        throw new Error(`Expo API returned ${response.status}: ${error}`);
      }

      const result = await response.json();
      this.logger.log(`[PUSH] ✓ Expo API success response:`, JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      this.logger.error('[PUSH] Failed to send to Expo Push Service:', error);
      throw error;
    }
  }

  /**
   * Batch send push notifications (useful for bulk operations)
   */
  async sendPushForNotifications(notificationIds: string[]) {
    for (const id of notificationIds) {
      await this.sendPushForNotification(id);
    }
  }
}
