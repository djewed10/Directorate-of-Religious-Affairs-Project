import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, Alert, Image as RNImage, Platform } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppCard } from './AppCard';
import { AppText } from './AppText';
import { BottomSheet, type BottomSheetRef } from './BottomSheet';
import { ArrowClockwise, Camera, FileArrowUp, ImageSquare, UploadSimple, X } from './icons';
import { ThemedButton } from './ThemedButton';
import { useTheme } from '@/theme/theme';
import { useToast } from './Toast';

export interface PickedUpload {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
  kind: 'image' | 'document';
  pageCount?: number;
}

interface ScanPage {
  uri: string;
  base64: string;
  size: number;
}

type UploadState = 'empty' | 'uploading' | 'uploaded' | 'error';

function base64Size(base64?: string) {
  if (!base64) return 0;
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

// interactive cropper state
const noop = () => {};

function formatSize(value?: number) {
  const size = Number(value ?? 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

async function compressImage(asset: ImagePicker.ImagePickerAsset): Promise<PickedUpload> {
  const manipulated = await ImageManipulator.manipulateAsync(asset.uri, [], {
    compress: 0.72,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  return {
    uri: manipulated.uri,
    name: asset.fileName ?? `scan-${Date.now()}.jpg`,
    mimeType: 'image/jpeg',
    size: base64Size(manipulated.base64),
    kind: 'image',
  };
}

async function scanPage(asset: ImagePicker.ImagePickerAsset): Promise<ScanPage> {
  const manipulated = await ImageManipulator.manipulateAsync(asset.uri, [], {
    compress: 0.78,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  return {
    uri: manipulated.uri,
    base64: manipulated.base64 ?? '',
    size: base64Size(manipulated.base64),
  };
}

async function fileSize(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && typeof info.size === 'number' ? info.size : 0;
}

async function createPdfFromScanPages(pages: ScanPage[]): Promise<PickedUpload> {
  if (Platform.OS === 'web') {
    throw new Error('عذراً، ميزة إنشاء ملفات PDF غير مدعومة على المتصفح. يرجى استخدام التطبيق على الهاتف (Android/iOS).');
  }

  if (!pages.length) throw new Error('يرجى مسح صفحة واحدة على الأقل');
  const html = `<!doctype html>
<html dir="rtl">
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: A4; margin: 0; }
      body { margin: 0; background: #fff; }
      .page { page-break-after: always; width: 210mm; min-height: 297mm; display: flex; align-items: center; justify-content: center; background: #fff; }
      .page:last-child { page-break-after: auto; }
      img { width: 100%; max-height: 297mm; object-fit: contain; }
    </style>
  </head>
  <body>
    ${pages.map((page) => `<section class="page"><img src="data:image/jpeg;base64,${page.base64}" /></section>`).join('')}
  </body>
</html>`;
  // Import expo-print only when needed (native platforms only)
  const Print = await import('expo-print');
  const printed = await Print.printToFileAsync({ html });
  return {
    uri: printed.uri,
    name: `scan-${new Date().toISOString().slice(0, 10)}-${Date.now()}.pdf`,
    mimeType: 'application/pdf',
    size: await fileSize(printed.uri),
    kind: 'document',
    pageCount: pages.length,
  };
}

export function UploadCard({
  state,
  fileName,
  fileSize,
  progress = 0,
  onPress,
  onRetry,
}: {
  state: UploadState;
  fileName?: string;
  fileSize?: number;
  progress?: number;
  onPress?: () => void;
  onRetry?: () => void;
}) {
  const { colors, radius, spacing } = useTheme();
  const width = useSharedValue(progress);
  width.value = withTiming(progress, { duration: 220 });
  const progressStyle = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(100, width.value))}%` }));
  const error = state === 'error';

  return (
    <AppCard onPress={onPress} style={[styles.uploadCard, error && { borderColor: colors.danger }]}>
      <View style={[styles.iconWrap, { backgroundColor: error ? colors.dangerSoft : colors.primarySoft, borderRadius: radius.xl }]}>
        {error ? <ArrowClockwise color={colors.danger} size={26} weight="duotone" /> : <UploadSimple color={colors.primary} size={26} weight="duotone" />}
      </View>
      <View style={[styles.uploadText, { gap: spacing.xs }]}>
        <AppText variant="subtitle">{fileName ?? 'ارفع الملفات أو الصور'}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {state === 'empty'
            ? 'كاميرا، مكتبة الصور أو ملف PDF'
            : state === 'uploading'
              ? 'جاري الرفع...'
              : state === 'error'
                ? 'تعذر رفع الملف'
                : formatSize(fileSize)}
        </AppText>
        {state === 'uploading' ? (
          <View style={[styles.progressTrack, { backgroundColor: colors.cardAlt, borderRadius: radius.full }]}>
            <Animated.View style={[styles.progressBar, { backgroundColor: colors.primary, borderRadius: radius.full }, progressStyle]} />
          </View>
        ) : null}
      </View>
      {error && onRetry ? (
        <ThemedButton title="إعادة" tone="danger" onPress={onRetry} />
      ) : null}
    </AppCard>
  );
}

export function UploadPicker({
  value,
  onChange,
  compact,
  documentMode,
  imageOnly,
  allowScanPdf,
}: {
  value: PickedUpload[];
  onChange: (files: PickedUpload[]) => void;
  compact?: boolean;
  documentMode?: boolean;
  imageOnly?: boolean;
  allowScanPdf?: boolean;
}) {
  const { colors, radius, spacing } = useTheme();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanPages, setScanPages] = useState<ScanPage[]>([]);
  const methodSheetRef = useRef<BottomSheetRef>(null);
  const scanSheetRef = useRef<BottomSheetRef>(null);

  function openMethodSheet() {
    setSheetOpen(true);
    methodSheetRef.current?.present();
  }

  function closeMethodSheet() {
    setSheetOpen(false);
    methodSheetRef.current?.dismiss();
  }

  function openScanSheet() {
    setScanOpen(true);
    scanSheetRef.current?.present();
  }

  function closeScanSheet() {
    setScanOpen(false);
    scanSheetRef.current?.dismiss();
  }

  async function ensureCameraPermission() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      toast.warning('لا يمكن فتح الكاميرا بدون صلاحية الوصول');
      return false;
    }
    return true;
  }

  async function ensureMediaLibraryPermission() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.warning('لا يمكن فتح مكتبة الصور بدون صلاحية الوصول');
      return false;
    }
    return true;
  }

  async function addImages(fromCamera = false) {
    setBusy(true);
    try {
      if (fromCamera && !(await ensureCameraPermission())) return;
      if (!fromCamera && !(await ensureMediaLibraryPermission())) return;
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({
            quality: 0.85,
            allowsEditing: true, // we use editing instead of multiple selection for cropping
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });
      if (!result.canceled) {
        const prepared: PickedUpload[] = [];
        for (const asset of result.assets) {
          const compressed = await compressImage(asset);
          prepared.push(compressed);
        }
        onChange([...value, ...prepared]);
      }
    } catch {
      toast.error(fromCamera ? 'تعذر فتح الكاميرا أو تجهيز الصورة' : 'تعذر فتح مكتبة الصور أو تجهيز الصورة');
    } finally {
      setBusy(false);
      closeMethodSheet();
    }
  }

  async function addScanPage() {
    setBusy(true);
    try {
      if (!(await ensureCameraPermission())) return;
      const result = await ImagePicker.launchCameraAsync({ quality: 0.9, allowsEditing: true }); // enable native crop
      if (!result.canceled && result.assets[0]) {
        const scanned = await scanPage(result.assets[0]);
        setScanPages((current) => [...current, scanned]);
      }
    } catch {
      toast.error('تعذر فتح الكاميرا أو إنشاء صفحة المسح');
    } finally {
      setBusy(false);
    }
  }

  async function finishScan() {
    setBusy(true);
    try {
      const pdf = await createPdfFromScanPages(scanPages);
      onChange(documentMode ? [pdf] : [...value, pdf]);
      setScanPages([]);
      closeScanSheet();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر إنشاء ملف PDF من الصفحات');
    } finally {
      setBusy(false);
    }
  }

  async function addDocuments() {
    setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: !documentMode,
        copyToCacheDirectory: true,
        type: documentMode ? 'application/pdf' : ['application/pdf', 'image/*'],
      });
      if (!result.canceled) {
        const docs = result.assets
          .filter((asset) => !documentMode || (asset.mimeType ?? '').includes('pdf') || asset.name.toLowerCase().endsWith('.pdf'))
          .map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          mimeType: documentMode ? 'application/pdf' : (asset.mimeType ?? 'application/octet-stream'),
          size: asset.size ?? 0,
          kind: 'document' as const,
        }));
        if (!docs.length) {
          toast.error('يرجى اختيار ملف PDF');
          return;
        }
        onChange(documentMode ? docs.slice(0, 1) : [...value, ...docs]);
      }
    } catch {
      toast.error('تعذر فتح منتقي الملفات');
    } finally {
      setBusy(false);
      closeMethodSheet();
    }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      {!compact ? <AppText variant="subtitle">{documentMode ? 'الوثيقة' : imageOnly ? 'الصور' : 'الملفات والصور'}</AppText> : null}
      <UploadCard
        state={busy ? 'uploading' : value.length ? 'uploaded' : 'empty'}
        fileName={value[0]?.name}
        fileSize={value[0]?.size}
        progress={busy ? 52 : 100}
        onPress={openMethodSheet}
      />
      {value.length ? (
        <View style={[styles.files, { gap: spacing.sm }]}>
          {value.map((file, index) => (
            <View key={`${file.uri}-${index}`} style={[styles.file, { backgroundColor: colors.cardAlt, borderRadius: radius.lg, paddingHorizontal: spacing.md }]}>
              <View style={styles.fileText}>
                <AppText numberOfLines={1}>{file.name}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {formatSize(file.size)}
                </AppText>
              </View>
              <Pressable onPress={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} style={styles.remove}>
                <X size={17} color={colors.danger} weight="bold" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <BottomSheet ref={methodSheetRef} visible={sheetOpen} onClose={() => setSheetOpen(false)} snapPoints={['34%', '52%']}>
        <AppText variant="subtitle">اختر طريقة الرفع</AppText>
        <View style={[styles.sheetActions, { gap: spacing.sm }]}>
          <ThemedButton
            title={documentMode ? 'مسح ضوئي بالكاميرا' : 'كاميرا'}
            icon={Camera}
            onPress={() => {
              if (documentMode) {
                closeMethodSheet();
                openScanSheet();
              } else {
                void addImages(true);
              }
            }}
            loading={busy}
          />
          {!documentMode && allowScanPdf ? (
            <ThemedButton
              title="مسح ضوئي PDF"
              icon={FileArrowUp}
              tone="secondary"
              onPress={() => {
                closeMethodSheet();
                openScanSheet();
              }}
              loading={busy}
            />
          ) : null}
          {!documentMode ? <ThemedButton title="مكتبة الصور" icon={ImageSquare} tone="neutral" onPress={() => addImages(false)} loading={busy} /> : null}
          {!imageOnly ? <ThemedButton title="ملف PDF" icon={FileArrowUp} tone="neutral" onPress={addDocuments} loading={busy} /> : null}
        </View>
      </BottomSheet>
      <BottomSheet ref={scanSheetRef} visible={scanOpen} onClose={() => setScanOpen(false)} snapPoints={['64%', '92%']}>
        <AppText variant="subtitle">مسح الوثيقة وتحويلها إلى PDF</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          أضف صفحة أو أكثر، احذف الصفحة غير الواضحة، ثم أنشئ ملف PDF قابل للطباعة.
        </AppText>
        {scanPages.length ? (
          <View style={[styles.scanGrid, { gap: spacing.sm }]}>
            {scanPages.map((page, index) => (
              <View key={`${page.uri}-${index}`} style={[styles.scanPage, { backgroundColor: colors.cardAlt, borderRadius: radius.lg }]}>
                <Image source={{ uri: page.uri }} style={styles.scanImage} contentFit="cover" />
                <View style={styles.scanPageActions}>
                  <AppText variant="caption" color={colors.textPrimary}>صفحة {index + 1}</AppText>
                  <View style={styles.scanButtons}>
                    <Pressable
                      disabled={index === 0}
                      onPress={() =>
                        setScanPages((current) => {
                          const next = [...current];
                          [next[index - 1], next[index]] = [next[index], next[index - 1]];
                          return next;
                        })
                      }
                      style={styles.smallAction}
                    >
                      <AppText variant="caption" color={index === 0 ? colors.textMuted : colors.primary}>رفع</AppText>
                    </Pressable>
                    <Pressable
                      disabled={index === scanPages.length - 1}
                      onPress={() =>
                        setScanPages((current) => {
                          const next = [...current];
                          [next[index + 1], next[index]] = [next[index], next[index + 1]];
                          return next;
                        })
                      }
                      style={styles.smallAction}
                    >
                      <AppText variant="caption" color={index === scanPages.length - 1 ? colors.textMuted : colors.primary}>خفض</AppText>
                    </Pressable>
                    <Pressable onPress={() => setScanPages((current) => current.filter((_, itemIndex) => itemIndex !== index))} style={styles.smallAction}>
                      <X size={15} color={colors.danger} weight="bold" />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <AppCard style={styles.emptyScan}>
            <AppText color={colors.textMuted}>لم تتم إضافة صفحات بعد</AppText>
          </AppCard>
        )}
        <View style={[styles.sheetActions, { gap: spacing.sm }]}>
          <ThemedButton title="إضافة صفحة بالكاميرا" icon={Camera} onPress={addScanPage} loading={busy} />
          <ThemedButton title="إنشاء PDF" icon={FileArrowUp} tone="secondary" disabled={!scanPages.length || busy} loading={busy} onPress={finishScan} />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderStyle: 'dashed',
  },
  iconWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    flex: 1,
  },
  progressTrack: {
    height: 7,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBar: {
    height: 7,
  },
  files: {
    width: '100%',
  },
  file: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileText: {
    flex: 1,
    gap: 3,
  },
  remove: {
    padding: 8,
  },
  sheetActions: {
    width: '100%',
  },
  scanGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  scanPage: {
    width: '48%',
    overflow: 'hidden',
  },
  scanImage: {
    width: '100%',
    aspectRatio: 0.72,
  },
  scanPageActions: {
    padding: 8,
    gap: 6,
  },
  scanButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallAction: {
    minHeight: 28,
    minWidth: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyScan: {
    alignItems: 'center',
  },
});
