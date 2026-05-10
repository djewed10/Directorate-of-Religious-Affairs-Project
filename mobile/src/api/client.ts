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
  const rawToken = await authStorage.getToken();
  let token: string | null = rawToken ? String(rawToken) : null;
  // sanitize common storage issues: quoted JSON strings or already-prefixed 'Bearer '
  if (token && token.startsWith('"') && token.endsWith('"')) token = token.slice(1, -1);
  if (token && token.toLowerCase().startsWith('bearer ')) token = token.slice(7);
  // DEBUG: log API URL and token presence for troubleshooting
  try {
    // Avoid logging full token in production; show presence and first chars
    // eslint-disable-next-line no-console
    console.log('[apiFetch] url=', API_URL + path, 'tokenPresent=', !!token, token ? `${String(token).slice(0,8)}...` : null);
  } catch (e) {}
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
    // If unauthorized, clear storage to avoid repeated 401s from stale/corrupt tokens
    if (response.status === 401) {
      try {
        await authStorage.clear();
      } catch (e) {}
      try {
        if (typeof window !== 'undefined') window.location.reload();
      } catch (e) {}
    }
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
