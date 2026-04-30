import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
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
    Alert.alert('OCR غير متوفر', 'استخراج النص بالكاميرا متاح في تطبيق الهاتف فقط. يمكن الإدخال يدويًا.');
    return null;
  }
  await ImagePicker.requestCameraPermissionsAsync();
  const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
  if (result.canceled) return null;

  const nativeOcr = loadNativeOcr();
  if (!nativeOcr) {
    Alert.alert('OCR غير مفعل', 'هذا البناء لا يحتوي وحدة OCR المحلية. استعمل الإدخال اليدوي أو ابن Custom Dev Client.');
    return null;
  }

  const text = await nativeOcr.recognizeText(result.assets[0].uri);
  return extractOcrValues(text, officialCodeRegex);
}

