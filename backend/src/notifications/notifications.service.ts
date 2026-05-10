import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { pageLimit } from '../common/pagination';
import type { AuthUser } from '../common/types';
import { DB, type AppDb } from '../db/database.module';
import { mosques, notifications, pushTokens } from '../db/schema';
import { ExpoPushService } from '../jobs/expo-push.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(DB) private readonly db: AppDb,
    private readonly expoPushService: ExpoPushService,
  ) {}

  async create(dto: CreateNotificationDto) {
    const [created] = await this.db
      .insert(notifications)
      .values({
        userId: dto.userId ?? null,
        mosqueId: dto.mosqueId ?? null,
        type: dto.type,
        titleAr: dto.titleAr,
        bodyAr: dto.bodyAr,
        metadataJson: dto.metadataJson ?? {},
      })
      .returning();

    // Keep DB as source of truth and trigger phone push for the same record.
    await this.expoPushService.sendPushForNotification(created.id);

    return created;
  }

  async list(user: AuthUser, query?: { unreadOnly?: string; type?: string; category?: string; page?: number; limit?: number }) {
    const { limit, offset } = pageLimit(query?.page, query?.limit ?? 30);
    const filters = [eq(notifications.userId, user.sub)];
    if (query?.unreadOnly === 'true') filters.push(eq(notifications.isRead, false));
    if (query?.type) filters.push(eq(notifications.type, query.type));
    if (query?.category) {
      const types = this.typesForCategory(query.category);
      if (types.length) filters.push(inArray(notifications.type, types));
    }
    if (query?.unreadOnly !== 'true') {
      filters.push(sql`(${notifications.isRead} = false or ${notifications.createdAt} > now() - interval '3 days')`);
    }
    return this.db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        mosqueId: notifications.mosqueId,
        type: notifications.type,
        titleAr: notifications.titleAr,
        bodyAr: notifications.bodyAr,
        isRead: notifications.isRead,
        metadataJson: notifications.metadataJson,
        createdAt: notifications.createdAt,
        mosqueName: mosques.name,
        officialCode: mosques.officialCode,
        commune: mosques.commune,
      })
      .from(notifications)
      .leftJoin(mosques, eq(notifications.mosqueId, mosques.id))
      .where(and(...filters))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async unreadCount(user: AuthUser) {
    const [row] = await this.db
      .select({ count: count(notifications.id) })
      .from(notifications)
      .where(and(eq(notifications.userId, user.sub), eq(notifications.isRead, false)));
    return { count: Number(row?.count ?? 0) };
  }

  async markRead(user: AuthUser, id: string) {
    const [updated] = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.sub)))
      .returning();
    return updated;
  }

  async delete(user: AuthUser, id: string) {
    const [deleted] = await this.db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.sub)))
      .returning();
    if (!deleted) throw new NotFoundException('Notification not found');
    return deleted;
  }

  async registerPushToken(user: AuthUser, dto: RegisterPushTokenDto) {
    const existing = await this.db
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.expoPushToken, dto.expoPushToken))
      .limit(1);
    if (existing[0]) {
      const [updated] = await this.db
        .update(pushTokens)
        .set({
          userId: user.sub,
          platform: dto.platform,
          deviceName: dto.deviceName ?? null,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(pushTokens.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await this.db
      .insert(pushTokens)
      .values({
        userId: user.sub,
        platform: dto.platform,
        expoPushToken: dto.expoPushToken,
        deviceName: dto.deviceName ?? null,
      })
      .returning();
    return created;
  }

  private typesForCategory(category: string) {
    if (category === 'documents') return ['document_expired', 'document_expiring_soon', 'document_expiring'];
    if (category === 'consumption') return ['consumption_update'];
    if (category === 'progression') return ['progression_update'];
    if (category === 'external') {
      return [
        'external_consumption_control_received',
        'external_progression_update_received',
        'external_document_renewal_received',
        'external_document_upload_received',
        'external_cover_image_update_received',
      ];
    }
    if (category === 'general') return ['mosque_inactive', 'test'];
    return [];
  }
}
