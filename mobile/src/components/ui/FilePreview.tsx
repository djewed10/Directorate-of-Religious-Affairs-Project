import { useQuery } from '@tanstack/react-query';
import { Image, ImageStyle } from 'expo-image';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Linking, Modal, Platform, Pressable, Share, StyleProp, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/api/queries';
import { AppText } from './AppText';
import { FilePdf, FileText, ImageSquare, X } from './icons';
import { ThemedButton } from './ThemedButton';
import { useTheme } from '@/theme/theme';

type Media = {
  id?: string;
  storageKey: string;
  mimeType?: string | null;
  autoTitle?: string | null;
  originalFilename?: string | null;
};

export function useSignedUrl(storageKey?: string | null) {
  return useQuery({
    queryKey: ['signed-url', storageKey],
    queryFn: () => api.signedViewUrl(storageKey!),
    enabled: Boolean(storageKey),
    staleTime: 12 * 60 * 1000,
  });
}

export function StorageImage({
  storageKey,
  style,
  fallback,
}: {
  storageKey?: string | null;
  style: StyleProp<ImageStyle>;
  fallback?: ReactNode;
}) {
  const signed = useSignedUrl(storageKey);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [storageKey]);
  if (!storageKey || !signed.data?.url || signed.isError || failed) return <>{fallback ?? null}</>;
  return <Image source={{ uri: signed.data.url }} style={style} contentFit="cover" transition={180} onError={() => setFailed(true)} />;
}

export async function openStorageFile(storageKey: string, fallbackMessage?: (message: string) => void) {
  try {
    const signed = await api.signedViewUrl(storageKey);
    if (!signed.url) throw new Error('لا يمكن عرض هذا الملف');
    if (Platform.OS === 'web') {
      window.open(signed.url, '_blank', 'noopener,noreferrer');
      return;
    }
    const canOpen = await Linking.canOpenURL(signed.url);
    if (canOpen) await Linking.openURL(signed.url);
    else await Share.share({ url: signed.url, message: signed.url });
  } catch (error) {
    fallbackMessage?.(error instanceof Error ? error.message : 'لا يمكن عرض هذا الملف');
  }
}

export async function shareStorageFile(storageKey: string, fallbackMessage?: (message: string) => void) {
  try {
    const signed = await api.signedViewUrl(storageKey);
    if (!signed.url) throw new Error('لا يمكن عرض هذا الملف');
    if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
      try {
        const localUri = await downloadSignedUrlToCache(signed.url, storageKey);
        await Sharing.shareAsync(localUri, { mimeType: mimeTypeFromStorageKey(storageKey) });
        return;
      } catch {
        // Some platforms require a local file URI; fall back to sharing the signed URL.
      }
    }
    await Share.share({ url: signed.url, message: signed.url });
  } catch (error) {
    fallbackMessage?.(error instanceof Error ? error.message : 'لا يمكن مشاركة هذا الملف');
  }
}

export async function printStorageFile(storageKey: string, fallbackMessage?: (message: string) => void) {
  try {
    const signed = await api.signedViewUrl(storageKey);
    if (!signed.url) throw new Error('لا يمكن عرض هذا الملف');
    if (Platform.OS === 'web') {
      window.open(signed.url, '_blank', 'noopener,noreferrer');
      fallbackMessage?.('تم فتح الملف في نافذة جديدة، استخدم أمر الطباعة من المتصفح');
      return;
    }
    const localUri = await downloadSignedUrlToCache(signed.url, storageKey);
    await Print.printAsync({ uri: localUri });
  } catch {
    fallbackMessage?.('يمكنك فتح الملف أو مشاركته للطباعة من تطبيق خارجي');
  }
}

async function downloadSignedUrlToCache(url: string, storageKey: string) {
  const baseName = sanitizeFileName(storageKey.split('/').pop() ?? `document-${Date.now()}.pdf`);
  const target = new File(Paths.cache, `${Date.now()}-${baseName}`);
  const downloaded = await File.downloadFileAsync(url, target, { idempotent: true });
  return downloaded.uri;
}

function sanitizeFileName(value: string) {
  return value.replace(/[^\w.\-]+/g, '-').slice(-90) || 'document.pdf';
}

function mimeTypeFromStorageKey(storageKey: string) {
  const lower = storageKey.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return undefined;
}

export function MediaThumbStrip({ media, onOpen }: { media?: Media[]; onOpen?: (media: Media, index: number) => void }) {
  const { colors, radius, spacing } = useTheme();
  const images = (media ?? []).filter((item) => item.mimeType?.startsWith('image/')).slice(0, 3);
  const extra = Math.max(0, (media?.length ?? 0) - images.length);
  if (!media?.length) return null;
  return (
    <View style={[styles.strip, { gap: spacing.sm }]}>
      {images.map((item, index) => (
        <Pressable key={item.id ?? item.storageKey} onPress={() => onOpen?.(item, index)} style={[styles.thumb, { borderRadius: radius.md, backgroundColor: colors.cardAlt }]}>
          <StorageImage storageKey={item.storageKey} style={styles.thumbImage} />
        </Pressable>
      ))}
      {extra ? (
        <View style={[styles.more, { borderRadius: radius.md, backgroundColor: colors.cardAlt }]}>
          <AppText variant="button">+{extra}</AppText>
        </View>
      ) : null}
      {!images.length ? (
        <View style={[styles.fileChip, { borderRadius: radius.md, backgroundColor: colors.cardAlt }]}>
          <FileText size={18} color={colors.primary} weight="duotone" />
          <AppText variant="caption">ملفات مرفقة</AppText>
        </View>
      ) : null}
    </View>
  );
}

export function FileActionRow({
  storageKey,
  mimeType,
  title,
  onError,
}: {
  storageKey: string;
  mimeType?: string | null;
  title?: string | null;
  onError?: (message: string) => void;
}) {
  const { colors, radius, spacing } = useTheme();
  const IconComponent = mimeType?.startsWith('image/') ? ImageSquare : mimeType === 'application/pdf' ? FilePdf : FileText;
  return (
    <Pressable
      onPress={() => openStorageFile(storageKey, onError)}
      style={[styles.fileRow, { backgroundColor: colors.cardAlt, borderRadius: radius.lg, padding: spacing.md }]}
    >
      <IconComponent size={22} color={colors.primary} weight="duotone" />
      <View style={styles.fileName}>
        <AppText numberOfLines={1}>{title ?? 'ملف مرفق'}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          اضغط للفتح أو المشاركة
        </AppText>
      </View>
    </Pressable>
  );
}

export function ImageViewer({
  media,
  visible,
  onClose,
  onInsertDocument,
}: {
  media?: Media | null;
  visible: boolean;
  onClose: () => void;
  onInsertDocument?: () => void;
}) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const signed = useSignedUrl(media?.storageKey);
  const previewWidth = Platform.OS === 'web' ? Math.round(width * 0.7) : Math.max(280, Math.round(width - 40));
  const previewHeight = Platform.OS === 'web' ? Math.round(height * 0.7) : Math.round(height * 0.68);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.viewer, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={styles.close} onPress={onClose}>
          <X size={24} color={colors.white} weight="bold" />
        </Pressable>
        {signed.data?.url ? (
          <Pressable style={styles.imageFrame} onPress={(event) => event.stopPropagation()}>
            <Image source={{ uri: signed.data.url }} style={[styles.fullImage, { width: previewWidth, height: previewHeight }]} contentFit="contain" />
          </Pressable>
        ) : null}
        <View style={styles.buttonGroup}>
          {media?.storageKey ? <ThemedButton title="فتح الملف" tone="neutral" onPress={() => openStorageFile(media.storageKey)} /> : null}
          {onInsertDocument ? <ThemedButton title="إضافة وثيقة" onPress={onInsertDocument} /> : null}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: 68,
    height: 68,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  more: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileChip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fileName: {
    flex: 1,
    gap: 3,
  },
  viewer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  imageFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  close: {
    position: 'absolute',
    top: 48,
    right: 22,
    zIndex: 2,
    padding: 10,
  },
  fullImage: {
    maxWidth: 980,
  },
  buttonGroup: {
    gap: 10,
    width: '100%',
    maxWidth: 300,
  },
});
