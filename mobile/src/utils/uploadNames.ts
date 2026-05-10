import type { PickedUpload } from '@/components/UploadPicker';

export function uploadDateStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function cleanFileSegment(value?: string | null) {
  return (value || 'unknown')
    .trim()
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'unknown';
}

export function uploadExtension(file: PickedUpload, fallback = 'bin') {
  const fromName = file.name.match(/\.([a-zA-Z0-9]{2,6})$/)?.[1];
  if (fromName) return fromName.toLowerCase();
  if (file.mimeType === 'application/pdf') return 'pdf';
  if (file.mimeType === 'image/png') return 'png';
  if (file.mimeType === 'image/webp') return 'webp';
  if (file.mimeType.startsWith('image/')) return 'jpg';
  return fallback;
}

export function buildUploadFilename(parts: Array<string | number | null | undefined>, extension: string) {
  const name = parts
    .map((part) => cleanFileSegment(part == null ? '' : String(part)))
    .filter((part) => part !== 'unknown')
    .join('_');
  return `${name || 'upload'}.${cleanFileSegment(extension)}`;
}
