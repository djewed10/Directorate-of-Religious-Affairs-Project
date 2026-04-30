import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Save } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, ActivityIndicator, StyleSheet, View } from 'react-native';
import { apiFetch, uploadToSignedUrl } from '@/api/client';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { DatePickerField } from '@/components/DatePickerField';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from '@/components/SearchBar';
import { Screen } from '@/components/Screen';
import { ThemedButton } from '@/components/ThemedButton';
import { UploadPicker, type PickedUpload } from '@/components/UploadPicker';
import { useAuth } from '@/auth/AuthProvider';
import { useAppTheme } from '@/theme/theme';
import type { DocumentType, MosqueListRow } from '@/types/api';

export default function DocumentUploadScreen() {
  const params = useLocalSearchParams<{ mosqueId?: string }>();
  const { token, loading } = useAuth();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const [mosqueId, setMosqueId] = useState(params.mosqueId ?? '');
  const [q, setQ] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [expirationDate, setExpirationDate] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [files, setFiles] = useState<PickedUpload[]>([]);
  const types = useQuery({ queryKey: ['document-types'], queryFn: api.documentTypes, enabled: !!token });
  const mosques = useQuery({ queryKey: ['mosque-picker', q], queryFn: () => api.mosques({ q, limit: 8 }), enabled: !!token && !params.mosqueId });

  const groupedTypes = useMemo(() => types.data ?? [], [types.data]);
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!mosqueId) throw new Error('اختر المسجد');
      if (!documentType) throw new Error('اختر نوع الوثيقة');
      if (!files.length) throw new Error('اختر ملفًا واحدًا على الأقل');

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const signed = await api.signUpload({
          mimeType: file.mimeType,
          originalFilename: file.name,
          folder: `mosques/${mosqueId}/documents`,
          fileSize: file.size,
        });
        await uploadToSignedUrl(signed.uploadUrl, file.uri, file.mimeType);
        await apiFetch('/documents', {
          method: 'POST',
          body: {
            mosqueId,
            documentTypeId: documentType.id,
            issueDate: issueDate || undefined,
            expirationDate: documentType.supportsExpiration && expirationDate ? expirationDate : undefined,
            storageKey: signed.storageKey,
            mimeType: file.mimeType,
            fileSize: file.size,
            originalFilename: `${documentType.labelAr} - ${file.name}`,
            replacementMode: index === 0 ? 'archive_current' : 'additional',
          },
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallet', mosqueId] });
      router.replace(`/mosques/${mosqueId}`);
    },
    onError: (error) => Alert.alert('تعذر رفع الوثيقة', error instanceof Error ? error.message : 'خطأ غير معروف'),
  });

  if (!loading && !token) return <Redirect href="/login" />;

  return (
    <Screen>
      <View>
        <AppText variant="title">إضافة وثيقة</AppText>
        <AppText color={colors.muted}>لا حاجة لكتابة عنوان، النوع المختار يولد الاسم تلقائيًا</AppText>
      </View>
      {!params.mosqueId ? (
        <AppCard style={styles.card}>
          <AppText variant="subtitle">اختر المسجد</AppText>
          <SearchBar value={q} onChangeText={setQ} />
          {mosques.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
          {(mosques.data as MosqueListRow[] | undefined)?.map((row) => (
            <AppCard key={row.mosque.id} onPress={() => setMosqueId(row.mosque.id)} style={[styles.pick, mosqueId === row.mosque.id && { borderColor: colors.primary }]}>
              <AppText>{row.mosque.name}</AppText>
              <AppText variant="caption" color={colors.info}>رقم {row.mosque.officialCode} - {row.mosque.commune}</AppText>
            </AppCard>
          ))}
        </AppCard>
      ) : null}

      <AppCard style={styles.card}>
        <AppText variant="subtitle">نوع الوثيقة</AppText>
        <View style={styles.typeGrid}>
          {groupedTypes.map((type) => (
            <AppCard key={type.id} onPress={() => setDocumentType(type)} style={[styles.typeItem, documentType?.id === type.id && { borderColor: colors.primary }]}>
              <AppText numberOfLines={2}>{type.labelAr}</AppText>
              <AppText variant="caption" color={type.supportsExpiration ? colors.warning : colors.info}>
                {type.supportsExpiration ? 'تدعم تاريخ انتهاء' : 'بدون صلاحية'}
              </AppText>
            </AppCard>
          ))}
          {!types.isLoading && !groupedTypes.length ? <EmptyState title="لا توجد أنواع وثائق" /> : null}
        </View>
      </AppCard>

      {documentType ? (
        <AppCard style={styles.card}>
          <DatePickerField label="تاريخ الإصدار اختياري" value={issueDate} onChangeText={setIssueDate} />
          {documentType.supportsExpiration ? (
            <DatePickerField label="تاريخ الانتهاء اختياري" value={expirationDate} onChangeText={setExpirationDate} />
          ) : (
            <AppText color={colors.info}>هذا النوع لا يحتاج تاريخ انتهاء، لذلك لن تظهر تنبيهات صلاحية له.</AppText>
          )}
        </AppCard>
      ) : null}

      <UploadPicker value={files} onChange={setFiles} />
      <ThemedButton title="حفظ الوثيقة" icon={Save} disabled={uploadMutation.isPending} onPress={() => uploadMutation.mutate()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
  },
  pick: {
    gap: 4,
    shadowOpacity: 0,
    elevation: 0,
  },
  typeGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeItem: {
    width: 170,
    minHeight: 84,
    gap: 6,
    shadowOpacity: 0,
    elevation: 0,
  },
});

