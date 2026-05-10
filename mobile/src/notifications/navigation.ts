import { router } from 'expo-router';
import { apiFetch } from '@/api/client';

export type NotificationTargetType =
  | 'document_expired'
  | 'document_expiring'
  | 'consumption_update'
  | 'progression_update'
  | 'mosque_inactive'
  | 'external_request_completed';

type NotificationLike = {
  id?: string;
  type?: string;
  mosqueId?: string | null;
  metadataJson?: Record<string, unknown> | null;
  [key: string]: unknown;
};

let routerReady = false;
let queuedNotification: NotificationLike | null = null;

export function setNotificationRouterReady() {
  routerReady = true;
  if (queuedNotification) {
    const pending = queuedNotification;
    queuedNotification = null;
    void navigateFromNotification(pending);
  }
}

export async function navigateFromNotification(notification: NotificationLike) {
  if (!routerReady) {
    queuedNotification = notification;
    return;
  }

  const target = normalizeTarget(notification);
  const notificationId = stringValue(notification.id ?? notification.notificationId);
  if (notificationId) {
    apiFetch(`/notifications/${notificationId}/read`, { method: 'PATCH' }).catch(() => undefined);
  }

  if (!target.mosqueId) {
    router.push('/notifications');
    return;
  }

  if (target.targetType === 'document_expired' || target.targetType === 'document_expiring') {
    router.push({
      pathname: '/mosques/[id]',
      params: { id: target.mosqueId, section: 'documents', documentId: target.documentId ?? '' },
    });
    return;
  }

  if (target.targetType === 'consumption_update') {
    router.push({
      pathname: '/mosques/[id]',
      params: { id: target.mosqueId, section: 'consumption', consumptionId: target.consumptionId ?? '' },
    });
    return;
  }

  if (target.targetType === 'progression_update') {
    router.push({
      pathname: '/mosques/[id]',
      params: { id: target.mosqueId, section: 'progression', progressionId: target.progressionId ?? '' },
    });
    return;
  }

  if (target.targetType === 'external_request_completed') {
    const section = target.documentId ? 'documents' : target.consumptionId ? 'consumption' : target.progressionId ? 'progression' : 'overview';
    router.push({
      pathname: '/mosques/[id]',
      params: {
        id: target.mosqueId,
        section,
        documentId: target.documentId ?? '',
        consumptionId: target.consumptionId ?? '',
        progressionId: target.progressionId ?? '',
        externalRequestId: target.externalRequestId ?? '',
      },
    });
    return;
  }

  router.push({ pathname: '/mosques/[id]', params: { id: target.mosqueId, section: 'overview' } });
}

function normalizeTarget(notification: NotificationLike) {
  const metadata = (notification.metadataJson ?? {}) as Record<string, unknown>;
  const targetType =
    stringValue(metadata.targetType ?? notification.targetType) ??
    inferTargetType(stringValue(notification.type ?? metadata.type));
  return {
    targetType,
    mosqueId: stringValue(metadata.mosqueId ?? notification.mosqueId),
    documentId: stringValue(metadata.documentId ?? notification.documentId),
    consumptionId: stringValue(metadata.consumptionId ?? metadata.consumptionUpdateId ?? notification.consumptionId),
    progressionId: stringValue(metadata.progressionId ?? metadata.progressionUpdateId ?? notification.progressionId),
    externalRequestId: stringValue(metadata.externalRequestId ?? notification.externalRequestId),
  };
}

function inferTargetType(type?: string): NotificationTargetType {
  if (type === 'document_expired') return 'document_expired';
  if (type === 'document_expiring_soon' || type === 'document_expiring') return 'document_expiring';
  if (type === 'consumption_update') return 'consumption_update';
  if (type === 'progression_update') return 'progression_update';
  if (type?.startsWith('external_')) return 'external_request_completed';
  return 'mosque_inactive';
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.length ? value : undefined;
}
