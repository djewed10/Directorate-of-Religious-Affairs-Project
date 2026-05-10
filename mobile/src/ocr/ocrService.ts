import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { ENABLE_NATIVE_OCR } from '@/config/env';
import { extractOcrValues, type OcrExtraction } from './extractors';

type NativeOcrModule = {
  recognizeText: (uri: string) => Promise<string>;
};

function loadNativeOcr(): NativeOcrModule | null {
  if (Platform.OS === 'web' || !ENABLE_NATIVE_OCR) return null;
  try {
    const maybeModule = require('react-native-mlkit-ocr') as unknown;
    if (maybeModule && typeof (maybeModule as NativeOcrModule).recognizeText === 'function') {
      return maybeModule as NativeOcrModule;
    }
    if (
      maybeModule &&
      typeof (maybeModule as { default?: NativeOcrModule }).default?.recognizeText === 'function'
    ) {
      return (maybeModule as { default: NativeOcrModule }).default;
    }
  } catch {
    return null;
  }
  return null;
}

export async function scanImageForOcr(officialCodeRegex?: string): Promise<OcrExtraction | null> {
  if (Platform.OS === 'web') {
    return null;
  }
  const nativeOcr = loadNativeOcr();
  if (!nativeOcr) {
    return null;
  }

  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('لا يمكن فتح الكاميرا بدون صلاحية الوصول');
  }

  const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
  if (result.canceled) return null;

  const text = await nativeOcr.recognizeText(result.assets[0].uri);
  return extractOcrValues(text, officialCodeRegex);
}
