import { API_URL } from '@/config/env';
import { authStorage } from '@/storage/secureStore';

type Query = Record<string, string | number | boolean | undefined | null>;
type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  query?: Query;
  body?: unknown;
};

function withQuery(path: string, query?: Query) {
  if (!query) return path;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const token = await authStorage.getToken();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (!(options.body instanceof FormData) && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${withQuery(path, options.query)}`, {
    ...options,
    headers,
    body:
      options.body && !(options.body instanceof FormData) && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : (options.body as BodyInit | undefined),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message =
      typeof data?.error?.message === 'string'
        ? data.error.message
        : typeof data?.message === 'string'
          ? data.message
          : 'تعذر تنفيذ العملية';
    throw new Error(message);
  }
  return data as T;
}

export async function uploadToSignedUrl(uploadUrl: string, uri: string, mimeType: string) {
  const fileResponse = await fetch(uri);
  const blob = await fileResponse.blob();
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: blob,
  });
  if (!response.ok) throw new Error('تعذر رفع الملف');
}
