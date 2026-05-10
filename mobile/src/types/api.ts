export type UserRole = 'admin' | 'manager' | 'operator';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Association {
  id: string;
  name: string;
  phone?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
}

export type MosqueStatusCode =
  | 'under_construction'
  | 'completed'
  | 'renovation'
  | 'neighborhood_no_friday'
  | 'light_follow_up'
  | 'archived';

export interface Mosque {
  id: string;
  officialCode: string;
  name: string;
  associationId?: string | null;
  commune: string;
  daira?: string | null;
  wilaya?: string | null;
  address?: string | null;
  zoneType: 'urban' | 'rural' | 'semi_urban';
  mosqueStatus: MosqueStatusCode;
  receivesFridayDonations: boolean;
  currentProgressPercent?: number | null;
  estimatedTotalProjectCost?: number | null;
  estimatedCompletionCost?: number | null;
  coverImageStorageKey?: string | null;
  lastAidDate?: string | null;
  aidCount: number;
  totalAidAmount: number;
  totalConsumedAmount: number;
  lastActivityAt: string;
}

export interface MosqueListRow {
  mosque: Mosque;
  associationName?: string | null;
}

export interface DocumentType {
  id: string;
  code: string;
  labelAr: string;
  group: 'mosque_file' | 'association_file' | 'technical' | 'financial' | 'consumption' | 'progression' | 'other';
  supportsExpiration: boolean;
  isRequiredDefault: boolean;
  isPinnedDefault: boolean;
  retentionPolicy: string;
  sortOrder: number;
  isActive: boolean;
}

export interface DocumentRow {
  document: {
    id: string;
    mosqueId: string;
    documentTypeId: string;
    storageKey: string;
    mimeType: string;
    fileSize: number;
    originalFilename: string;
    expirationDate?: string | null;
    issueDate?: string | null;
    uploadedAt: string;
    isPinned: boolean;
    currentVersionNumber: number;
  };
  type: DocumentType;
}

export interface TimelineMedia {
  id?: string;
  fileKind: 'image' | 'document';
  mediaType?: 'cheque_image' | 'invoice' | 'handwritten_note' | 'progression_photo' | 'other';
  storageKey: string;
  mimeType: string;
  fileSize: number;
  autoTitle?: string;
}

export interface DashboardSummary {
  cards: Record<string, number>;
  latestDocuments: Array<{
    document: Record<string, unknown>;
    documentTypeLabel: string;
    mosqueName: string;
    officialCode: string;
    commune: string;
  }>;
  latestProgression: Array<{ update: Record<string, unknown>; mosqueName: string; officialCode: string; commune: string }>;
  latestConsumption: Array<{ update: Record<string, unknown>; mosqueName: string; officialCode: string; commune: string }>;
  lastAidMosque?: Mosque | null;
  top: {
    needFollowUp: Mosque[];
    expiredDocuments: Array<{ mosqueId: string; name: string; officialCode: string; commune: string; expiredCount: number }>;
    recentActivity: Mosque[];
    noUpdateSincePeriod: Mosque[];
    consumptionWithoutEnoughProof: Array<{ mosqueId: string; name: string; officialCode: string; commune: string; count: number }>;
  };
}

export interface ReferenceData {
  statuses: Array<{ code: MosqueStatusCode; labelAr: string; receivesFridayDonationsDefault: boolean }>;
  stages: Array<{ code: string; labelAr: string }>;
  categories: Array<{ code: string; labelAr: string }>;
  ocrConfig?: { officialCodeRegex: string; dateRegex: string } | null;
}
