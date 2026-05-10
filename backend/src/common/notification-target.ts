export type NotificationTargetType =
  | 'document_expired'
  | 'document_expiring'
  | 'consumption_update'
  | 'progression_update'
  | 'mosque_inactive'
  | 'external_request_completed';

export type NotificationMetadata = {
  targetType?: NotificationTargetType;
  mosqueId?: string;
  documentId?: string;
  consumptionId?: string;
  progressionId?: string;
  externalRequestId?: string;
  [key: string]: unknown;
};

export function notificationMetadata(metadata?: Record<string, unknown> | null): NotificationMetadata {
  return (metadata ?? {}) as NotificationMetadata;
}
