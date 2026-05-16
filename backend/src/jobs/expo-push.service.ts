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

      // Prepare messages with minimal, Expo-compatible payload
      const richImageUrl = await this.getMosqueRichImageUrl(notif.mosqueId);

      const messages = tokens.map((token: typeof pushTokens.$inferSelect): ExpoPushMessage => {
        // Keep payload simple and string-only to avoid Expo parsing issues
        // Only include essential metadata that app needs to navigate/handle notification
        const metadata = (notif.metadataJson ?? {}) as Record<string, unknown>;
        const essentialData: Record<string, string> = {
          notificationId: notif.id,
          type: notif.type,
          mosqueId: notif.mosqueId || '',
        };
        
        // Only add metadata values that are primitives (string, number, boolean)
        Object.entries(metadata).forEach(([key, value]) => {
          if (value !== undefined && value !== null && typeof value !== 'object') {
            essentialData[key] = String(value);
          }
        });

        const message = {
          to: token.expoPushToken,
          sound: 'default',
          title: notif.titleAr,
          body: notif.bodyAr,
          data: essentialData,
          ...(richImageUrl ? { richContent: { image: richImageUrl } } : {}),
        };
        this.logger.log(`[PUSH] Prepared message for token ${token.expoPushToken.slice(0, 30)}... - Data keys: ${Object.keys(essentialData).join(',')}`);
        return message;
      });

      this.logger.log(`[PUSH] Sending ${messages.length} message(s) to Expo API...`);
      // Group messages by project owner (Expo owner/projectId) before sending
      // This is necessary because Expo doesn't allow mixed projects in a single request
      const messagesByProject = new Map<string, ExpoPushMessage[]>();
      messages.forEach((msg) => {
        // Extract project from token: ExponentPushToken[...] is always the same project if from same owner
        // For now, we'll send them and let Expo group them; if we get mixed projects error, retry individually
        const key = 'default'; // Will be refined per token if needed
        if (!messagesByProject.has(key)) {
          messagesByProject.set(key, []);
        }
        messagesByProject.get(key)!.push(msg);
      });

      // Send to Expo with proper grouping
      await this.sendToExpoGrouped(messages, notificationId);
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
   * Send messages to Expo, handling mixed project errors by retrying individually
   */
  private async sendToExpoGrouped(messages: ExpoPushMessage[], notificationId: string) {
    try {
      // First, try sending all messages together
      this.logger.log(`[PUSH] Attempting batch send of ${messages.length} message(s)...`);
      const batchResult = await this.sendToExpo(messages);
      return batchResult;
    } catch (batchError: any) {
      // If we get PUSH_TOO_MANY_EXPERIENCE_IDS error, it means mixed projects
      // Retry each message individually
      if (batchError?.message?.includes('PUSH_TOO_MANY_EXPERIENCE_IDS')) {
        this.logger.warn(
          `[PUSH] ⚠ Batch send failed due to mixed projects. Retrying ${messages.length} message(s) individually...`,
        );
        const results: any[] = [];
        for (let i = 0; i < messages.length; i++) {
          try {
            this.logger.log(`[PUSH] Retrying message ${i + 1}/${messages.length} (token: ${messages[i].to.slice(0, 30)}...)`);
            const result = await this.sendToExpo([messages[i]]);
            results.push({ success: true, token: messages[i].to, result });
          } catch (error) {
            this.logger.error(`[PUSH] Failed to send individual message ${i + 1}/${messages.length}:`, error);
            results.push({ success: false, token: messages[i].to, error });
          }
        }
        const successful = results.filter((r) => r.success).length;
        this.logger.log(
          `[PUSH] Individual retry complete: ${successful}/${messages.length} succeeded for notification ${notificationId}`,
        );
        if (successful < messages.length) {
          throw new Error(`Partial failure: ${successful}/${messages.length} messages sent successfully`);
        }
        return results;
      }
      throw batchError;
    }
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

      const responseText = await response.text();
      const result = responseText ? JSON.parse(responseText) : {};

      this.logger.log(`[PUSH] Expo API response status: ${response.status} ${response.statusText}`);
      this.logger.log(`[PUSH] Expo API response body:`, JSON.stringify(result, null, 2));

      if (!response.ok) {
        const errorMsg = result?.errors?.[0]?.message || responseText || `HTTP ${response.status}`;
        this.logger.error(`[PUSH] Expo API error (${response.status}): ${errorMsg}`);
        throw new Error(`Expo API returned ${response.status}: ${errorMsg}`);
      }

      // Check for Expo ticket errors (success status but individual message failures)
      if (result?.data && Array.isArray(result.data)) {
        const errors = result.data.filter((item: any) => item?.details?.error);
        if (errors.length > 0) {
          this.logger.warn(`[PUSH] ⚠ Some messages failed at Expo:`, JSON.stringify(errors, null, 2));
          errors.forEach((err: any) => {
            this.logger.error(`[PUSH] Individual error: ${err?.details?.error}`);
          });
        }
      }

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
