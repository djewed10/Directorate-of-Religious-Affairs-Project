import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export type UserRole = 'admin' | 'manager' | 'operator';
export type MosqueStatusCode =
  | 'under_construction'
  | 'completed'
  | 'renovation'
  | 'neighborhood_no_friday'
  | 'light_follow_up'
  | 'archived';
export type ZoneType = 'urban' | 'rural' | 'semi_urban';
export type DocumentGroup =
  | 'mosque_file'
  | 'association_file'
  | 'technical'
  | 'financial'
  | 'consumption'
  | 'progression'
  | 'other';
export type RetentionPolicy =
  | 'keep_all_versions'
  | 'archive_old_versions'
  | 'replace_after_confirmation'
  | 'temporary_delete_after_days';
export type DocumentSourceKind = 'internal_upload' | 'external_upload' | 'renewal_upload';
export type TimelineSourceKind = 'internal' | 'external';
export type ExternalRequestType =
  | 'consumption_control'
  | 'progression_update'
  | 'document_renewal'
  | 'document_upload'
  | 'cover_image_update';
export type ExternalRequestStatus = 'pending' | 'completed' | 'expired' | 'cancelled';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').$type<UserRole>().default('operator').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_unique').on(table.email),
  }),
);

export const associations = pgTable(
  'associations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    phone: text('phone'),
    contactPerson: text('contact_person'),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index('associations_name_idx').on(table.name),
  }),
);

export const mosqueStatuses = pgTable('mosque_statuses', {
  code: text('code').$type<MosqueStatusCode>().primaryKey(),
  labelAr: text('label_ar').notNull(),
  receivesFridayDonationsDefault: boolean('receives_friday_donations_default').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const mosques = pgTable(
  'mosques',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    officialCode: text('official_code').notNull(),
    name: text('name').notNull(),
    associationId: uuid('association_id').references(() => associations.id, { onDelete: 'set null' }),
    commune: text('commune').notNull(),
    daira: text('daira'),
    wilaya: text('wilaya'),
    address: text('address'),
    locationText: text('location_text'),
    zoneType: text('zone_type').$type<ZoneType>().default('urban').notNull(),
    classification: text('classification'),
    populationCoverage: integer('population_coverage'),
    poorAreaFlag: boolean('poor_area_flag').default(false).notNull(),
    mosqueStatus: text('mosque_status').$type<MosqueStatusCode>().default('under_construction').notNull(),
    receivesFridayDonations: boolean('receives_friday_donations').default(true).notNull(),
    currentProgressPercent: integer('current_progress_percent'),
    estimatedTotalProjectCost: numeric('estimated_total_project_cost', { precision: 14, scale: 2 }).$type<number>(),
    estimatedCompletionCost: numeric('estimated_completion_cost', { precision: 14, scale: 2 }).$type<number>(),
    coverImageStorageKey: text('cover_image_storage_key'),
    lastAidDate: date('last_aid_date'),
    aidCount: integer('aid_count').default(0).notNull(),
    totalAidAmount: numeric('total_aid_amount', { precision: 14, scale: 2 }).$type<number>().default(0).notNull(),
    totalConsumedAmount: numeric('total_consumed_amount', { precision: 14, scale: 2 }).$type<number>().default(0).notNull(),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).defaultNow().notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    codeIdx: uniqueIndex('mosques_official_code_unique').on(table.officialCode),
    nameIdx: index('mosques_name_idx').on(table.name),
    communeIdx: index('mosques_commune_idx').on(table.commune),
    statusIdx: index('mosques_status_idx').on(table.mosqueStatus),
    fridayIdx: index('mosques_friday_idx').on(table.receivesFridayDonations),
  }),
);

export const aidRecords = pgTable(
  'aid_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    mosqueId: uuid('mosque_id')
      .references(() => mosques.id, { onDelete: 'cascade' })
      .notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).$type<number>().notNull(),
    aidDate: date('aid_date').notNull(),
    sourceType: text('source_type').$type<'friday_donations' | 'grant' | 'other'>(),
    referenceNumber: text('reference_number'),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => ({
    mosqueIdx: index('aid_records_mosque_idx').on(table.mosqueId),
    dateIdx: index('aid_records_date_idx').on(table.aidDate),
  }),
);

export const documentTypes = pgTable(
  'document_types',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull(),
    labelAr: text('label_ar').notNull(),
    group: text('group').$type<DocumentGroup>().notNull(),
    supportsExpiration: boolean('supports_expiration').default(false).notNull(),
    isRequiredDefault: boolean('is_required_default').default(false).notNull(),
    isPinnedDefault: boolean('is_pinned_default').default(false).notNull(),
    retentionPolicy: text('retention_policy').$type<RetentionPolicy>().default('keep_all_versions').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    codeIdx: uniqueIndex('document_types_code_unique').on(table.code),
    groupIdx: index('document_types_group_idx').on(table.group),
  }),
);

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    mosqueId: uuid('mosque_id')
      .references(() => mosques.id, { onDelete: 'cascade' })
      .notNull(),
    documentTypeId: uuid('document_type_id')
      .references(() => documentTypes.id)
      .notNull(),
    uploadedByUserId: uuid('uploaded_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    sourceKind: text('source_kind').$type<DocumentSourceKind>().default('internal_upload').notNull(),
    issueDate: date('issue_date'),
    expirationDate: date('expiration_date'),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
    storageKey: text('storage_key').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSize: integer('file_size').notNull(),
    originalFilename: text('original_filename').notNull(),
    currentVersionNumber: integer('current_version_number').default(1).notNull(),
    isPinned: boolean('is_pinned').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    mosqueIdx: index('documents_mosque_idx').on(table.mosqueId),
    typeIdx: index('documents_type_idx').on(table.documentTypeId),
    expirationIdx: index('documents_expiration_idx').on(table.expirationDate),
    activeIdx: index('documents_active_idx').on(table.isActive),
  }),
);

export const documentVersions = pgTable(
  'document_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id')
      .references(() => documents.id, { onDelete: 'cascade' })
      .notNull(),
    versionNumber: integer('version_number').notNull(),
    storageKey: text('storage_key').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSize: integer('file_size').notNull(),
    issueDate: date('issue_date'),
    expirationDate: date('expiration_date'),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
    uploadedByUserId: uuid('uploaded_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    changeReason: text('change_reason').$type<'new_upload' | 'renewal' | 'replacement'>().default('new_upload').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    documentVersionIdx: uniqueIndex('document_versions_document_version_unique').on(
      table.documentId,
      table.versionNumber,
    ),
  }),
);

export const progressionStages = pgTable('progression_stages', {
  code: text('code').primaryKey(),
  labelAr: text('label_ar').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const progressionUpdates = pgTable(
  'progression_updates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    mosqueId: uuid('mosque_id')
      .references(() => mosques.id, { onDelete: 'cascade' })
      .notNull(),
    sourceKind: text('source_kind').$type<TimelineSourceKind>().default('internal').notNull(),
    stageCode: text('stage_code').references(() => progressionStages.code),
    progressPercent: integer('progress_percent'),
    shortNote: text('short_note'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    externalRequestId: uuid('external_request_id'),
    ...timestamps,
  },
  (table) => ({
    mosqueIdx: index('progression_updates_mosque_idx').on(table.mosqueId),
    createdIdx: index('progression_updates_created_idx').on(table.createdAt),
  }),
);

export const progressionMedia = pgTable(
  'progression_media',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    progressionUpdateId: uuid('progression_update_id')
      .references(() => progressionUpdates.id, { onDelete: 'cascade' })
      .notNull(),
    fileKind: text('file_kind').$type<'image' | 'document'>().notNull(),
    storageKey: text('storage_key').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSize: integer('file_size').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    autoTitle: text('auto_title').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    updateIdx: index('progression_media_update_idx').on(table.progressionUpdateId),
  }),
);

export const consumptionCategories = pgTable('consumption_categories', {
  code: text('code').primaryKey(),
  labelAr: text('label_ar').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const consumptionUpdates = pgTable(
  'consumption_updates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    mosqueId: uuid('mosque_id')
      .references(() => mosques.id, { onDelete: 'cascade' })
      .notNull(),
    aidRecordId: uuid('aid_record_id').references(() => aidRecords.id, { onDelete: 'set null' }),
    sourceKind: text('source_kind').$type<TimelineSourceKind>().default('internal').notNull(),
    consumptionCategoryCode: text('consumption_category_code').references(() => consumptionCategories.code),
    withdrawnAmount: numeric('withdrawn_amount', { precision: 14, scale: 2 }).$type<number>(),
    shortNote: text('short_note'),
    optionalProgressPercent: integer('optional_progress_percent'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    externalRequestId: uuid('external_request_id'),
    ...timestamps,
  },
  (table) => ({
    mosqueIdx: index('consumption_updates_mosque_idx').on(table.mosqueId),
    createdIdx: index('consumption_updates_created_idx').on(table.createdAt),
  }),
);

export const consumptionMedia = pgTable(
  'consumption_media',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    consumptionUpdateId: uuid('consumption_update_id')
      .references(() => consumptionUpdates.id, { onDelete: 'cascade' })
      .notNull(),
    fileKind: text('file_kind').$type<'image' | 'document'>().notNull(),
    mediaType: text('media_type')
      .$type<'cheque_image' | 'invoice' | 'handwritten_note' | 'progression_photo' | 'other'>()
      .notNull(),
    storageKey: text('storage_key').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSize: integer('file_size').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    autoTitle: text('auto_title').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    updateIdx: index('consumption_media_update_idx').on(table.consumptionUpdateId),
    typeIdx: index('consumption_media_type_idx').on(table.mediaType),
  }),
);

export const noteTemplates = pgTable(
  'note_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull(),
    labelAr: text('label_ar').notNull(),
    contentAr: text('content_ar').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex('note_templates_code_unique').on(table.code),
  }),
);

export const internalNotes = pgTable(
  'internal_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    mosqueId: uuid('mosque_id')
      .references(() => mosques.id, { onDelete: 'cascade' })
      .notNull(),
    createdByUserId: uuid('created_by_user_id')
      .references(() => users.id, { onDelete: 'set null' })
      .notNull(),
    templateCode: text('template_code'),
    content: text('content').notNull(),
    ...timestamps,
  },
  (table) => ({
    mosqueIdx: index('internal_notes_mosque_idx').on(table.mosqueId),
  }),
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    mosqueId: uuid('mosque_id').references(() => mosques.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    titleAr: text('title_ar').notNull(),
    bodyAr: text('body_ar').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    metadataJson: jsonb('metadata_json').$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('notifications_user_idx').on(table.userId),
    mosqueIdx: index('notifications_mosque_idx').on(table.mosqueId),
    readIdx: index('notifications_read_idx').on(table.isRead),
    createdIdx: index('notifications_created_idx').on(table.createdAt),
  }),
);

export const pushTokens = pgTable(
  'push_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    platform: text('platform').notNull(),
    expoPushToken: text('expo_push_token').notNull(),
    deviceName: text('device_name'),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    tokenIdx: uniqueIndex('push_tokens_token_unique').on(table.expoPushToken),
    userIdx: index('push_tokens_user_idx').on(table.userId),
  }),
);

export const externalUpdateRequests = pgTable(
  'external_update_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    mosqueId: uuid('mosque_id')
      .references(() => mosques.id, { onDelete: 'cascade' })
      .notNull(),
    requestType: text('request_type').$type<ExternalRequestType>().notNull(),
    relatedDocumentId: uuid('related_document_id').references(() => documents.id, { onDelete: 'set null' }),
    token: text('token').notNull(),
    shortCode: text('short_code'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    status: text('status').$type<ExternalRequestStatus>().default('pending').notNull(),
    createdByUserId: uuid('created_by_user_id')
      .references(() => users.id, { onDelete: 'set null' })
      .notNull(),
    allowProgressionFields: boolean('allow_progression_fields').default(false).notNull(),
    allowCoverUpdate: boolean('allow_cover_update').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    tokenIdx: uniqueIndex('external_update_requests_token_unique').on(table.token),
    codeIdx: uniqueIndex('external_update_requests_short_code_unique').on(table.shortCode),
    mosqueIdx: index('external_update_requests_mosque_idx').on(table.mosqueId),
    statusIdx: index('external_update_requests_status_idx').on(table.status),
  }),
);

export const ocrConfigs = pgTable('ocr_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  officialCodeRegex: text('official_code_regex').default('\\d{4,}').notNull(),
  dateRegex: text('date_regex').default('(\\d{2}[/-]\\d{2}[/-]\\d{4}|\\d{4}-\\d{2}-\\d{2})').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
});

export const schema = {
  users,
  associations,
  mosqueStatuses,
  mosques,
  aidRecords,
  documentTypes,
  documents,
  documentVersions,
  progressionStages,
  progressionUpdates,
  progressionMedia,
  consumptionCategories,
  consumptionUpdates,
  consumptionMedia,
  noteTemplates,
  internalNotes,
  notifications,
  pushTokens,
  externalUpdateRequests,
  ocrConfigs,
};
