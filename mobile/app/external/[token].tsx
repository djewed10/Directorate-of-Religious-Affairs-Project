import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { CheckCircle2, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ActivityIndicator, StyleSheet, View } from 'react-native';
import { apiFetch, uploadToSignedUrl } from '@/api/client';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { UploadPicker, type PickedUpload } from '@/components/UploadPicker';
import { useAppTheme } from '@/theme/theme';

type PublicRequest = {
  request: {
    id: string;
    requestType: 'consumption_control' | 'progression_update' | 'document_renewal' | 'document_upload' | 'cover_image_update';
    expiresAt: string;
    allowProgressionFields: boolean;
    allowCoverUpdate: boolean;
  };
  mosque: {
    id: string;
    name: string;
    officialCode: string;
    commune: string;
  };
};

export default function ExternalFormScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { colors } = useAppTheme();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [progressPercent, setProgressPercent] = useState('');
  const [progressionNote, setProgressionNote] = useState('');
  const [consumptionFiles, setConsumptionFiles] = useState<PickedUpload[]>([]);
  const [progressionFiles, setProgressionFiles] = useState<PickedUpload[]>([]);
  const [documentFiles, setDocumentFiles] = useState<PickedUpload[]>([]);
  const [done, setDone] = useState(false);
  const request = useQuery({
    queryKey: ['external', token],
    queryFn: () => apiFetch<PublicRequest>(`/external/${token}`),
    enabled: !!token,
    retry: false,
  });
  const submit = useMutation({
    mutationFn: async () => {
      if (!request.data) throw new Error('الطلب غير موجود');
      const mosqueId = request.data.mosque.id;
      const consumptionMedia = [];
      for (const file of consumptionFiles) {
        const signed = await api.signUpload({ mimeType: file.mimeType, originalFilename: file.name, folder: `external/${mosqueId}/consumption`, fileSize: file.size });
        await uploadToSignedUrl(signed.uploadUrl, file.uri, file.mimeType);
        consumptionMedia.push({
          fileKind: file.kind,
          mediaType: consumptionMedia.length === 0 ? 'cheque_image' : 'invoice',
          storageKey: signed.storageKey,
          mimeType: file.mimeType,
          fileSize: file.size,
          autoTitle: `استهلاك - ${file.name}`,
        });
      }

      const progressionMedia = [];
      for (const file of progressionFiles) {
        const signed = await api.signUpload({ mimeType: file.mimeType, originalFilename: file.name, folder: `external/${mosqueId}/progression`, fileSize: file.size });
        await uploadToSignedUrl(signed.uploadUrl, file.uri, file.mimeType);
        progressionMedia.push({ fileKind: file.kind, storageKey: signed.storageKey, mimeType: file.mimeType, fileSize: file.size, autoTitle: `تقدم - ${file.name}` });
      }

      const body: Record<string, unknown> = {
        withdrawnAmount: amount ? Number(amount) : undefined,
        shortNote: note,
        progressPercent: progressPercent ? Number(progressPercent) : undefined,
        progressionNote,
        consumptionMedia,
        progressionMedia,
      };

      if ((request.data.request.requestType === 'document_renewal' || request.data.request.requestType === 'document_upload') && documentFiles[0]) {
        const file = documentFiles[0];
        const signed = await api.signUpload({ mimeType: file.mimeType, originalFilename: file.name, folder: `external/${mosqueId}/documents`, fileSize: file.size });
        await uploadToSignedUrl(signed.uploadUrl, file.uri, file.mimeType);
        Object.assign(body, {
          documentStorageKey: signed.storageKey,
          documentMimeType: file.mimeType,
          documentFileSize: file.size,
          documentOriginalFilename: file.name,
        });
      }

      if (request.data.request.requestType === 'cover_image_update' && documentFiles[0]) {
        const file = documentFiles[0];
        const signed = await api.signUpload({ mimeType: file.mimeType, originalFilename: file.name, folder: `external/${mosqueId}/cover`, fileSize: file.size });
        await uploadToSignedUrl(signed.uploadUrl, file.uri, file.mimeType);
        body.coverImageStorageKey = signed.storageKey;
      }

      await apiFetch(`/external/${token}/submit`, { method: 'POST', body });
    },
    onSuccess: () => setDone(true),
    onError: (error) => Alert.alert('تعذر الإرسال', error instanceof Error ? error.message : 'خطأ غير معروف'),
  });

  if (request.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (request.isError || !request.data) {
    return (
      <Screen>
        <EmptyState title="الرابط غير صالح" body="قد يكون الطلب منتهيًا أو تم استعماله سابقًا." />
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen>
        <AppCard style={styles.done}>
          <CheckCircle2 color={colors.success} size={42} />
          <AppText variant="title">تم الإرسال</AppText>
          <AppText color={colors.muted}>وصل التحديث إلى المسؤول الداخلي.</AppText>
        </AppCard>
      </Screen>
    );
  }

  const type = request.data.request.requestType;
  return (
    <Screen>
      <AppCard style={styles.identity}>
        <AppText variant="title">{request.data.mosque.name}</AppText>
        <AppText color={colors.info}>رقم {request.data.mosque.officialCode} - بلدية {request.data.mosque.commune}</AppText>
        <AppText color={colors.muted}>هذا نموذج محدود ولا يتيح الاطلاع على أي ملفات داخلية.</AppText>
      </AppCard>

      {type === 'consumption_control' ? (
        <AppCard style={styles.form}>
          <AppText variant="subtitle">بيانات الاستهلاك</AppText>
          <ThemedInput label="المبلغ المسحوب" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <ThemedInput label="شرح قصير اختياري" value={note} onChangeText={setNote} multiline />
          <UploadPicker value={consumptionFiles} onChange={setConsumptionFiles} />
        </AppCard>
      ) : null}

      {type === 'progression_update' || request.data.request.allowProgressionFields ? (
        <AppCard style={styles.form}>
          <AppText variant="subtitle">تحديث تقدم اختياري</AppText>
          <ThemedInput label="نسبة التقدم" keyboardType="numeric" value={progressPercent} onChangeText={setProgressPercent} />
          <ThemedInput label="شرح التقدم" value={progressionNote} onChangeText={setProgressionNote} multiline />
          <UploadPicker value={progressionFiles} onChange={setProgressionFiles} />
        </AppCard>
      ) : null}

      {type === 'document_renewal' || type === 'document_upload' ? (
        <AppCard style={styles.form}>
          <AppText variant="subtitle">رفع الوثيقة</AppText>
          <UploadPicker value={documentFiles} onChange={(files) => setDocumentFiles(files.slice(0, 1))} />
        </AppCard>
      ) : null}

      {type === 'cover_image_update' ? (
        <AppCard style={styles.form}>
          <AppText variant="subtitle">صورة الغلاف</AppText>
          <UploadPicker value={documentFiles} onChange={(files) => setDocumentFiles(files.slice(0, 1))} />
        </AppCard>
      ) : null}

      <ThemedButton title="إرسال" icon={Send} disabled={submit.isPending} onPress={() => submit.mutate()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: {
    gap: 8,
  },
  form: {
    gap: 12,
  },
  done: {
    alignItems: 'center',
    gap: 10,
    marginTop: 80,
  },
});
