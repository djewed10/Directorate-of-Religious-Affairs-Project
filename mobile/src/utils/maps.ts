import { Linking, Platform } from 'react-native';

export function isValidGoogleMapsUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    return host === 'maps.app.goo.gl' || host === 'goo.gl' || host.endsWith('google.com') || host.endsWith('google.dz');
  } catch {
    return false;
  }
}

export async function openGoogleMapsUrl(url: string, onError: (message: string) => void) {
  try {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    const supported = await Linking.canOpenURL(url);
    if (!supported) throw new Error('unsupported');
    await Linking.openURL(url);
  } catch {
    onError('تعذر فتح الخريطة');
  }
}
