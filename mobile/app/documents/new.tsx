import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { apiFetch, uploadToSignedUrl } from '@/api/client';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { DatePickerField } from '@/components/DatePickerField';
import { SearchBar } from '@/components/SearchBar';
import { Screen } from '@/components/Screen';
import { ThemedButton } from '@/components/ThemedButton';
import { UploadPicker, type PickedUpload } from '@/components/UploadPicker';
import { useAuth } from '@/auth/AuthProvider';
import { SmartSearchInput, ToastMessages, useToast } from '@/components/ui';
import { FloppyDisk } from '@/components/ui/icons';
import { useAppTheme } from '@/theme/theme';
import type { DocumentType, Mosque, MosqueListRow } from '@/types/api';
import { buildUploadFilename, uploadDateStamp } from '@/utils/uploadNames';

export default function DocumentUploadScreen() {
  const params = useLocalSearchParams<{ mosqueId?: string }>();
  const { token, loading } = useAuth();
  const { colors } = useAppTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [mosqueId, setMosqueId] = useState(params.mosqueId ?? '');
  const [q, setQ] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [expirationDate, setExpirationDate] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [files, setFiles] = useState<PickedUpload[]>([]);
  const [step, setStep] = useState(params.mosqueId ? 2 : 1);
  const types = useQuery({ queryKey: ['document-types'], queryFn: api.documentTypes, enabled: !!token });
  const mosques = useQuery({ queryKey: ['mosque-picker', q], queryFn: () => api.mosques({ q, limit: 8 }), enabled: !!token && !params.mosqueId });
  const mosqueDetails = useQuery({
    queryKey: ['document-upload-mosque', mosqueId],
    queryFn: () => api.mosque(mosqueId) as Promise<{ mosque: Mosque }>,
    enabled: !!token && !!mosqueId,
  });
  const selectedMosque = (mosques.data as MosqueListRow[] | undefined)?.find((row) => row.mosque.id === mosqueId);
  const mosqueCode = selectedMosque?.mosque.officialCode ?? mosqueDetails.data?.mosque.officialCode ?? mosqueId;
  const totalSteps = params.mosqueId ? 3 : 4;
  const visibleStep = params.mosqueId ? step - 1 : step;

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!mosqueId) throw new Error('اختر المسجد');
      if (!documentType) throw new Error('اختر نوع الوثيقة');
      if (!files.length) throw new Error('اختر ملفًا واحدًا على الأقل');
      if (files.some((file) => file.mimeType !== 'application/pdf')) throw new Error('يرجى رفع ملف PDF أو إنشاء PDF بالمسح الضوئي');

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const generatedFilename = buildUploadFilename(
          [documentType.code, mosqueCode, issueDate || uploadDateStamp(), files.length > 1 ? index + 1 : null],
          'pdf',
        );
        const signed = await api.signUpload({
          mimeType: file.mimeType,
          originalFilename: generatedFilename,
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
            originalFilename: generatedFilename,
            replacementMode: index === 0 ? 'archive_current' : 'additional',
          },
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallet', mosqueId] });
      await queryClient.invalidateQueries({ queryKey: ['documents', mosqueId] });
      toast.success(ToastMessages.uploadSuccess);
      router.replace({ pathname: '/mosques/[id]', params: { id: mosqueId, section: 'documents' } });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : ToastMessages.uploadError),
  });

  if (!loading && !token) return <Redirect href="/login" />;

  return (
    <Screen>
      <View>
        <AppText variant="title">إضافة وثيقة</AppText>
        <AppText color={colors.muted}>لا حاجة لكتابة عنوان، النوع المختار يولد الاسم تلقائيًا</AppText>
      </View>
      <AppCard style={styles.progressCard}>
        <AppText variant="caption" color={colors.primary}>خطوة {visibleStep} من {totalSteps}</AppText>
        <View style={styles.progressTrack}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                { backgroundColor: index < visibleStep ? colors.primary : colors.cardAlt },
              ]}
            />
          ))}
        </View>
      </AppCard>
      {!params.mosqueId && step === 1 ? (
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
          <ThemedButton title="التالي" disabled={!mosqueId} onPress={() => setStep(2)} />
        </AppCard>
      ) : null}

      {step === 2 ? (
        <AppCard style={styles.card}>
          <SmartSearchInput
            types={types.data ?? []}
            value={documentType}
            onChange={setDocumentType}
            expirationDate={expirationDate}
            onExpirationDateChange={setExpirationDate}
            loading={types.isLoading}
            useSheet
          />
          {documentType ? (
            <DatePickerField label="تاريخ الإصدار اختياري" value={issueDate} onChangeText={setIssueDate} />
          ) : null}
          <View style={styles.actions}>
            {!params.mosqueId ? <ThemedButton title="رجوع" tone="neutral" onPress={() => setStep(1)} /> : null}
            <ThemedButton
              title="التالي"
              disabled={!documentType}
              onPress={() => {
                if (!documentType) toast.warning(ToastMessages.docTypeWarn);
                else setStep(3);
              }}
            />
          </View>
        </AppCard>
      ) : null}

      {step === 3 ? (
        <>
          <UploadPicker value={files} onChange={setFiles} documentMode />
          <View style={styles.actions}>
            <ThemedButton title="رجوع" tone="neutral" onPress={() => setStep(2)} />
            <ThemedButton title="التالي" disabled={!files.length} onPress={() => setStep(4)} />
          </View>
        </>
      ) : null}

      {step === 4 ? (
        <AppCard style={styles.card}>
          <AppText variant="subtitle">مراجعة قبل الحفظ</AppText>
          <Info label="المسجد" value={selectedMosque?.mosque.name ?? (params.mosqueId ? 'المسجد المحدد من صفحة التفاصيل' : mosqueId)} />
          <Info label="نوع الوثيقة" value={documentType?.labelAr ?? 'غير محدد'} />
          <Info label="عدد الملفات" value={String(files.length)} />
          {documentType?.supportsExpiration ? <Info label="تاريخ الانتهاء" value={expirationDate || 'غير محدد'} /> : null}
          <View style={styles.actions}>
            <ThemedButton title="رجوع" tone="neutral" onPress={() => setStep(3)} />
            <ThemedButton title="حفظ الوثيقة" icon={FloppyDisk} disabled={uploadMutation.isPending} loading={uploadMutation.isPending} onPress={() => uploadMutation.mutate()} />
          </View>
        </AppCard>
      ) : null}
    </Screen>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.infoRow}>
      <AppText color={colors.textMuted}>{label}</AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
  },
  progressCard: {
    gap: 8,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: 999,
  },
  pick: {
    gap: 4,
    shadowOpacity: 0,
    elevation: 0,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
});
