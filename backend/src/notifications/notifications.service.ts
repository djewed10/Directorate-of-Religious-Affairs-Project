import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import type { AuthUser } from '../common/types';
import { DB, type AppDb } from '../db/database.module';
import { notifications, pushTokens } from '../db/schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

@Injectable()
export class NotificationsService {
  constructor(@Inject(DB) private readonly db: AppDb) {}

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
    return created;
  }

  async list(user: AuthUser, query?: { unreadOnly?: string; type?: string }) {
    const filters = [eq(notifications.userId, user.sub)];
    if (query?.unreadOnly === 'true') filters.push(eq(notifications.isRead, false));
    if (query?.type) filters.push(eq(notifications.type, query.type));
    return this.db
      .select()
      .from(notifications)
      .where(and(...filters))
      .orderBy(desc(notifications.createdAt))
      .limit(100);
  }

  async markRead(user: AuthUser, id: string) {
    const [updated] = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.sub)))
      .returning();
    return updated;
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
}

