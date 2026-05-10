import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { apiFetch, uploadToSignedUrl } from '@/api/client';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { DatePickerField } from '@/components/DatePickerField';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { UploadPicker, type PickedUpload } from '@/components/UploadPicker';
import { SmartSearchInput, ToastMessages, useToast } from '@/components/ui';
import { CheckCircle, PaperPlaneTilt } from '@/components/ui/icons';
import { useAppTheme } from '@/theme/theme';
import type { DocumentType } from '@/types/api';
import { buildUploadFilename, uploadDateStamp, uploadExtension } from '@/utils/uploadNames';

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
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [progressPercent, setProgressPercent] = useState('');
  const [progressionNote, setProgressionNote] = useState('');
  const [consumptionFiles, setConsumptionFiles] = useState<PickedUpload[]>([]);
  const [progressionFiles, setProgressionFiles] = useState<PickedUpload[]>([]);
  const [documentFiles, setDocumentFiles] = useState<PickedUpload[]>([]);
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [issueDate, setIssueDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [done, setDone] = useState(false);
  const request = useQuery({
    queryKey: ['external', token],
    queryFn: () => apiFetch<PublicRequest>(`/external/${token}`),
    enabled: !!token,
    retry: false,
  });
  const documentTypes = useQuery({
    queryKey: ['external-document-types'],
    queryFn: api.publicDocumentTypes,
    enabled: request.data?.request.requestType === 'document_upload' || request.data?.request.requestType === 'document_renewal',
  });
  const submit = useMutation({
    mutationFn: async () => {
      if (!request.data) throw new Error('الطلب غير موجود');
      const mosqueId = request.data.mosque.id;
      const mosqueCode = request.data.mosque.officialCode;
      const consumptionMedia = [];
      for (let index = 0; index < consumptionFiles.length; index += 1) {
        const file = consumptionFiles[index];
        const generatedFilename = buildUploadFilename(['consumption', mosqueCode, uploadDateStamp(), index + 1], uploadExtension(file, 'jpg'));
        const signed = await api.signUpload({ mimeType: file.mimeType, originalFilename: generatedFilename, folder: `external/${mosqueId}/consumption`, fileSize: file.size });
        await uploadToSignedUrl(signed.uploadUrl, file.uri, file.mimeType);
        consumptionMedia.push({
          fileKind: file.kind,
          mediaType: consumptionMedia.length === 0 ? 'cheque_image' : 'invoice',
          storageKey: signed.storageKey,
          mimeType: file.mimeType,
          fileSize: file.size,
          autoTitle: generatedFilename,
        });
      }

      const progressionMedia = [];
      for (let index = 0; index < progressionFiles.length; index += 1) {
        const file = progressionFiles[index];
        const generatedFilename = buildUploadFilename(['progression', mosqueCode, uploadDateStamp(), index + 1], uploadExtension(file, 'jpg'));
        const signed = await api.signUpload({ mimeType: file.mimeType, originalFilename: generatedFilename, folder: `external/${mosqueId}/progression`, fileSize: file.size });
        await uploadToSignedUrl(signed.uploadUrl, file.uri, file.mimeType);
        progressionMedia.push({ fileKind: file.kind, storageKey: signed.storageKey, mimeType: file.mimeType, fileSize: file.size, autoTitle: generatedFilename });
      }

      const body: Record<string, unknown> = {
        withdrawnAmount: amount ? Number(amount) : undefined,
        shortNote: note,
        progressPercent: progressPercent ? Number(progressPercent) : undefined,
        progressionNote,
        consumptionMedia,
        progressionMedia,
      };

      if (request.data.request.requestType === 'document_renewal' || request.data.request.requestType === 'document_upload') {
        if (!documentFiles[0]) throw new Error('اختر ملف PDF');
        const file = documentFiles[0];
        if (file.mimeType !== 'application/pdf') throw new Error('يرجى رفع ملف PDF');
        if (!documentType) throw new Error('اختر نوع الوثيقة');
        const generatedFilename = buildUploadFilename([documentType.code, mosqueCode, issueDate || uploadDateStamp()], 'pdf');
        const signed = await api.signUpload({ mimeType: file.mimeType, originalFilename: generatedFilename, folder: `external/${mosqueId}/documents`, fileSize: file.size });
        await uploadToSignedUrl(signed.uploadUrl, file.uri, file.mimeType);
        Object.assign(body, {
          documentTypeId: documentType?.id,
          issueDate: issueDate || undefined,
          expirationDate: documentType?.supportsExpiration && expirationDate ? expirationDate : undefined,
          documentStorageKey: signed.storageKey,
          documentMimeType: file.mimeType,
          documentFileSize: file.size,
          documentOriginalFilename: generatedFilename,
        });
      }

      if (request.data.request.requestType === 'cover_image_update') {
        if (!documentFiles[0]) throw new Error('اختر صورة الغلاف');
        const file = documentFiles[0];
        if (!file.mimeType.startsWith('image/')) throw new Error('يرجى اختيار صورة');
        const generatedFilename = buildUploadFilename(['mosque', mosqueCode, 'cover', uploadDateStamp()], uploadExtension(file, 'jpg'));
        const signed = await api.signUpload({ mimeType: file.mimeType, originalFilename: generatedFilename, folder: `external/${mosqueId}/cover`, fileSize: file.size });
        await uploadToSignedUrl(signed.uploadUrl, file.uri, file.mimeType);
        body.coverImageStorageKey = signed.storageKey;
      }

      await apiFetch(`/external/${token}/submit`, { method: 'POST', body });
    },
    onSuccess: () => {
      toast.success(ToastMessages.saveSuccess);
      setDone(true);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : ToastMessages.saveError),
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
          <CheckCircle color={colors.success} size={42} weight="duotone" />
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
          <UploadPicker value={consumptionFiles} onChange={setConsumptionFiles} allowScanPdf />
        </AppCard>
      ) : null}

      {type === 'progression_update' || request.data.request.allowProgressionFields ? (
        <AppCard style={styles.form}>
          <AppText variant="subtitle">تحديث تقدم اختياري</AppText>
          <ThemedInput label="نسبة التقدم" keyboardType="numeric" value={progressPercent} onChangeText={setProgressPercent} />
          <ThemedInput label="شرح التقدم" value={progressionNote} onChangeText={setProgressionNote} multiline />
          <UploadPicker value={progressionFiles} onChange={setProgressionFiles} imageOnly />
        </AppCard>
      ) : null}

      {type === 'document_renewal' || type === 'document_upload' ? (
        <AppCard style={styles.form}>
          <AppText variant="subtitle">رفع الوثيقة</AppText>
          <SmartSearchInput
            types={documentTypes.data ?? []}
            value={documentType}
            onChange={setDocumentType}
            expirationDate={expirationDate}
            onExpirationDateChange={setExpirationDate}
            loading={documentTypes.isLoading}
            useSheet
          />
          <DatePickerField label="تاريخ الإصدار اختياري" value={issueDate} onChangeText={setIssueDate} />
          <UploadPicker value={documentFiles} onChange={(files) => setDocumentFiles(files.slice(0, 1))} documentMode />
        </AppCard>
      ) : null}

      {type === 'cover_image_update' ? (
        <AppCard style={styles.form}>
          <AppText variant="subtitle">صورة الغلاف</AppText>
          <UploadPicker value={documentFiles} onChange={(files) => setDocumentFiles(files.filter((file) => file.mimeType.startsWith('image/')).slice(0, 1))} imageOnly />
        </AppCard>
      ) : null}

      <ThemedButton title="إرسال" icon={PaperPlaneTilt} disabled={submit.isPending} loading={submit.isPending} onPress={() => submit.mutate()} />
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
