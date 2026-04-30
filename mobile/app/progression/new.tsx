import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Save } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { apiFetch, uploadToSignedUrl } from '@/api/client';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { FilterChips } from '@/components/FilterChips';
import { Screen } from '@/components/Screen';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { UploadPicker, type PickedUpload } from '@/components/UploadPicker';
import { useAuth } from '@/auth/AuthProvider';
import { useAppTheme } from '@/theme/theme';

export default function ProgressionFormScreen() {
  const { token, loading } = useAuth();
  const params = useLocalSearchParams<{ mosqueId?: string }>();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const reference = useQuery({ queryKey: ['reference'], queryFn: api.reference, enabled: !!token });
  const [stageCode, setStageCode] = useState('foundations');
  const [progressPercent, setProgressPercent] = useState('');
  const [shortNote, setShortNote] = useState('');
  const [files, setFiles] = useState<PickedUpload[]>([]);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!params.mosqueId) throw new Error('افتح الإضافة من صفحة المسجد');
      const media = [];
      for (const file of files) {
        const signed = await api.signUpload({ mimeType: file.mimeType, originalFilename: file.name, folder: `mosques/${params.mosqueId}/progression`, fileSize: file.size });
        await uploadToSignedUrl(signed.uploadUrl, file.uri, file.mimeType);
        media.push({ fileKind: file.kind, storageKey: signed.storageKey, mimeType: file.mimeType, fileSize: file.size, autoTitle: `تقدم الأشغال - ${file.name}` });
      }
      await apiFetch('/progression', {
        method: 'POST',
        body: {
          mosqueId: params.mosqueId,
          stageCode,
          progressPercent: progressPercent ? Number(progressPercent) : undefined,
          shortNote,
          media,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['progression', params.mosqueId] });
      router.replace(`/mosques/${params.mosqueId}`);
    },
    onError: (error) => Alert.alert('تعذر الحفظ', error instanceof Error ? error.message : 'خطأ غير معروف'),
  });

  if (!loading && !token) return <Redirect href="/login" />;

  return (
    <Screen>
      <View>
        <AppText variant="title">إضافة تقدم الأشغال</AppText>
        <AppText color={colors.muted}>صور متعددة مع مرحلة ونسبة اختيارية</AppText>
      </View>
      <AppCard style={styles.form}>
        <AppText variant="caption" color={colors.muted}>المرحلة</AppText>
        <FilterChips chips={(reference.data?.stages ?? []).map((s) => ({ key: s.code, label: s.labelAr }))} value={stageCode} onChange={setStageCode} />
        <ThemedInput label="نسبة التقدم %" keyboardType="numeric" value={progressPercent} onChangeText={setProgressPercent} />
        <ThemedInput label="ملاحظة قصيرة" value={shortNote} onChangeText={setShortNote} multiline />
      </AppCard>
      <UploadPicker value={files} onChange={setFiles} />
      <ThemedButton title="حفظ التقدم" icon={Save} disabled={mutation.isPending} onPress={() => mutation.mutate()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
});

