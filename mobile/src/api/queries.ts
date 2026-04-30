import { apiFetch } from './client';
import type { DashboardSummary, DocumentType, MosqueListRow, ReferenceData } from '@/types/api';

export const api = {
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; user: { sub: string; name: string; email: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  dashboard: () => apiFetch<DashboardSummary>('/dashboard'),
  mosques: (query?: Record<string, string | number | boolean | undefined>) =>
    apiFetch<MosqueListRow[]>('/mosques', { query }),
  mosque: (id: string) => apiFetch<Record<string, unknown>>(`/mosques/${id}`),
  mosqueWallet: (id: string) => apiFetch<any>(`/mosques/${id}/wallet`),
  search: (query: Record<string, string | number | undefined>) => apiFetch<MosqueListRow[]>('/search', { query }),
  documentTypes: () => apiFetch<DocumentType[]>('/document-types'),
  reference: () => apiFetch<ReferenceData>('/reference'),
  notifications: () => apiFetch<unknown[]>('/notifications'),
  signUpload: (body: { mimeType: string; originalFilename: string; folder?: string; fileSize?: number }) =>
    apiFetch<{ storageKey: string; uploadUrl: string; method: string; headers: Record<string, string> }>(
      '/storage/uploads/sign',
      { method: 'POST', body },
    ),
};
