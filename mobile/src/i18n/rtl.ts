import { I18nManager, Platform } from 'react-native';

export function setupRtl() {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }
}

