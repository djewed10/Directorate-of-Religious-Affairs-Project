import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Camera, FileUp, ImagePlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppCard } from './AppCard';
import { AppText } from './AppText';
import { ThemedButton } from './ThemedButton';
import { useAppTheme } from '@/theme/theme';

export interface PickedUpload {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
  kind: 'image' | 'document';
}

async function fileSize(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && 'size' in info && typeof info.size === 'number' ? info.size : 0;
}

async function compressImage(asset: ImagePicker.ImagePickerAsset): Promise<PickedUpload> {
  const manipulated = await ImageManipulator.manipulateAsync(asset.uri, [], {
    compress: 0.72,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return {
    uri: manipulated.uri,
    name: asset.fileName ?? `scan-${Date.now()}.jpg`,
    mimeType: 'image/jpeg',
    size: await fileSize(manipulated.uri),
    kind: 'image',
  };
}

export function UploadPicker({ value, onChange, compact }: { value: PickedUpload[]; onChange: (files: PickedUpload[]) => void; compact?: boolean }) {
  const { colors, radii } = useAppTheme();
  const [busy, setBusy] = useState(false);

  async function addImages(fromCamera = false) {
    setBusy(true);
    try {
      if (fromCamera) await ImagePicker.requestCameraPermissionsAsync();
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.85, allowsMultipleSelection: true, mediaTypes: ImagePicker.MediaTypeOptions.Images });
      if (!result.canceled) {
        const files = await Promise.all(result.assets.map(compressImage));
        onChange([...value, ...files]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function addDocuments() {
    setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
      if (!result.canceled) {
        const docs = await Promise.all(
          result.assets.map(async (asset) => ({
            uri: asset.uri,
            name: asset.name,
            mimeType: asset.mimeType ?? 'application/octet-stream',
            size: asset.size ?? (await fileSize(asset.uri)),
            kind: 'document' as const,
          })),
        );
        onChange([...value, ...docs]);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppCard style={styles.wrap}>
      {!compact ? <AppText variant="subtitle">الملفات والصور</AppText> : null}
      <View style={styles.actions}>
        <ThemedButton title="تصوير" icon={Camera} onPress={() => addImages(true)} disabled={busy} />
        <ThemedButton title="صور" icon={ImagePlus} tone="neutral" onPress={() => addImages(false)} disabled={busy} />
        <ThemedButton title="PDF" icon={FileUp} tone="neutral" onPress={addDocuments} disabled={busy} />
      </View>
      <View style={styles.files}>
        {value.map((file, index) => (
          <View key={`${file.uri}-${index}`} style={[styles.file, { backgroundColor: colors.surfaceMuted, borderRadius: radii.sm }]}>
            <AppText numberOfLines={1} style={styles.fileName}>{file.name}</AppText>
            <Pressable onPress={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} style={styles.remove}>
              <X size={16} color={colors.danger} />
            </Pressable>
          </View>
        ))}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  actions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  files: {
    gap: 8,
  },
  file: {
    minHeight: 40,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  fileName: {
    flex: 1,
  },
  remove: {
    padding: 6,
  },
});
