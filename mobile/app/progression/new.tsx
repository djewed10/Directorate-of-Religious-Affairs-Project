import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { apiFetch, uploadToSignedUrl } from '@/api/client';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { FilterChips } from '@/components/FilterChips';
import { Screen } from '@/components/Screen';
import { SearchBar } from '@/components/SearchBar';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { UploadPicker, type PickedUpload } from '@/components/UploadPicker';
import { useAuth } from '@/auth/AuthProvider';
import { ToastMessages, useToast } from '@/components/ui';
import { FloppyDisk } from '@/components/ui/icons';
import { useAppTheme } from '@/theme/theme';
import type { Mosque, MosqueListRow } from '@/types/api';
import { buildUploadFilename, uploadDateStamp, uploadExtension } from '@/utils/uploadNames';

export default function ProgressionFormScreen() {
  const { token, loading } = useAuth();
  const params = useLocalSearchParams<{ mosqueId?: string }>();
  const { colors } = useAppTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const reference = useQuery({ queryKey: ['reference'], queryFn: api.reference, enabled: !!token });
  const [q, setQ] = useState('');
  const [mosqueId, setMosqueId] = useState(params.mosqueId ?? '');
  const [stageCode, setStageCode] = useState('foundations');
  const [progressPercent, setProgressPercent] = useState('');
  const [shortNote, setShortNote] = useState('');
  const [files, setFiles] = useState<PickedUpload[]>([]);
  const mosques = useQuery({ queryKey: ['progression-mosques', q], queryFn: () => api.mosques({ q, limit: 8 }), enabled: !!token && !params.mosqueId });
  const selectedMosque = (mosques.data as MosqueListRow[] | undefined)?.find((row) => row.mosque.id === mosqueId);
  const mosqueDetails = useQuery({
    queryKey: ['progression-upload-mosque', mosqueId],
    queryFn: () => api.mosque(mosqueId) as Promise<{ mosque: Mosque }>,
    enabled: !!token && !!mosqueId,
  });
  const mosqueCode = selectedMosque?.mosque.officialCode ?? mosqueDetails.data?.mosque.officialCode ?? mosqueId;
  const mutation = useMutation({
    mutationFn: async () => {
      // prevent submitting a lower progress percent than the mosque's current recorded percent
      const newPercent = progressPercent ? Number(progressPercent) : undefined;
      const prev = mosqueDetails.data?.mosque?.currentProgressPercent;
      if (newPercent !== undefined && prev !== null && prev !== undefined && newPercent < prev) {
        throw new Error('نسبة التقدم الجديدة يجب أن تكون أكبر أو تساوي النسبة الحالية');
      }
      if (!mosqueId) throw new Error('اختر المسجد');
      const media = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const generatedFilename = buildUploadFilename(['progression', mosqueCode, uploadDateStamp(), index + 1], uploadExtension(file, 'jpg'));
        const signed = await api.signUpload({ mimeType: file.mimeType, originalFilename: generatedFilename, folder: `mosques/${mosqueId}/progression`, fileSize: file.size });
        await uploadToSignedUrl(signed.uploadUrl, file.uri, file.mimeType);
        media.push({ fileKind: file.kind, storageKey: signed.storageKey, mimeType: file.mimeType, fileSize: file.size, autoTitle: generatedFilename });
      }
      await apiFetch('/progression', {
        method: 'POST',
        body: {
          mosqueId,
          stageCode,
          progressPercent: progressPercent ? Number(progressPercent) : undefined,
          shortNote,
          media,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['progression', mosqueId] });
      toast.success(ToastMessages.saveSuccess);
      router.replace({ pathname: '/mosques/[id]', params: { id: mosqueId, section: 'progression' } });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : ToastMessages.saveError),
  });

  if (!loading && !token) return <Redirect href="/login" />;

  return (
    <Screen>
      <View>
        <AppText variant="title">إضافة تقدم الأشغال</AppText>
        <AppText color={colors.muted}>صور متعددة مع مرحلة ونسبة اختيارية</AppText>
      </View>
      <AppCard style={styles.form}>
        {!params.mosqueId ? (
          <View style={styles.picker}>
            <SearchBar value={q} onChangeText={setQ} placeholder="ابحث عن المسجد" />
            {(mosques.data as MosqueListRow[] | undefined)?.map((row) => (
              <AppCard
                key={row.mosque.id}
                onPress={() => setMosqueId(row.mosque.id)}
                style={[styles.pick, mosqueId === row.mosque.id && { borderColor: colors.primary }]}
              >
                <AppText>{row.mosque.name}</AppText>
                <AppText variant="caption" color={colors.info}>رقم {row.mosque.officialCode} - {row.mosque.commune}</AppText>
              </AppCard>
            ))}
          </View>
        ) : null}
        <AppText variant="caption" color={colors.muted}>المرحلة</AppText>
        <FilterChips chips={(reference.data?.stages ?? []).map((s) => ({ key: s.code, label: s.labelAr }))} value={stageCode} onChange={setStageCode} />
        <ThemedInput label="نسبة التقدم %" keyboardType="numeric" value={progressPercent} onChangeText={setProgressPercent} />
        <ThemedInput label="ملاحظة قصيرة" value={shortNote} onChangeText={setShortNote} multiline />
      </AppCard>
      <UploadPicker value={files} onChange={setFiles} imageOnly />
      <ThemedButton title="حفظ التقدم" icon={FloppyDisk} disabled={mutation.isPending} loading={mutation.isPending} onPress={() => mutation.mutate()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  picker: {
    gap: 8,
  },
  pick: {
    gap: 4,
    shadowOpacity: 0,
    elevation: 0,
  },
});
