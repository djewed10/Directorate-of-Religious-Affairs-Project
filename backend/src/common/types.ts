import type { UserRole } from '../db/schema';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface StoredMediaInput {
  fileKind: 'image' | 'document';
  storageKey: string;
  mimeType: string;
  fileSize: number;
  sortOrder?: number;
  autoTitle?: string;
}

