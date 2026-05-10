import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { apiFetch, uploadToSignedUrl } from '@/api/client';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { DatePickerField } from '@/components/DatePickerField';
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
import { buildUploadFilename, uploadDateStamp } from '@/utils/uploadNames';

const schema = z.object({
  mosqueId: z.string().min(1),
  amount: z.string().min(1),
  aidDate: z.string().min(8),
  sourceType: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type AidForm = z.infer<typeof schema>;

export default function AidFormScreen() {
  const { token, loading } = useAuth();
  const params = useLocalSearchParams<{ mosqueId?: string }>();
  const { colors } = useAppTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [files, setFiles] = useState<PickedUpload[]>([]);
  const mosques = useQuery({ queryKey: ['aid-mosques', q], queryFn: () => api.mosques({ q, limit: 8 }), enabled: !!token && !params.mosqueId });
  const { control, handleSubmit, watch, formState } = useForm<AidForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      mosqueId: params.mosqueId ?? '',
      amount: '',
      aidDate: new Date().toISOString().slice(0, 10),
      sourceType: 'friday_donations',
      referenceNumber: '',
      notes: '',
    },
  });
  const selectedMosqueId = watch('mosqueId');
  const selectedMosque = (mosques.data as MosqueListRow[] | undefined)?.find((row) => row.mosque.id === selectedMosqueId);
  const mosqueDetails = useQuery({
    queryKey: ['aid-upload-mosque', selectedMosqueId],
    queryFn: () => api.mosque(selectedMosqueId) as Promise<{ mosque: Mosque }>,
    enabled: !!token && !!selectedMosqueId,
  });
  const mosqueCode = selectedMosque?.mosque.officialCode ?? mosqueDetails.data?.mosque.officialCode ?? selectedMosqueId;
  const mutation = useMutation({
    mutationFn: async (values: AidForm) => {
      let attachment: Record<string, unknown> = {};
      const file = files[0];
      if (file) {
        if (file.mimeType !== 'application/pdf') throw new Error('يرجى اختيار ملف PDF للمرفق');
        const generatedFilename = buildUploadFilename(['aid', mosqueCode || values.mosqueId, values.aidDate || uploadDateStamp()], 'pdf');
        const signed = await api.signUpload({
          mimeType: file.mimeType,
          originalFilename: generatedFilename,
          folder: `mosques/${values.mosqueId}/aids`,
          fileSize: file.size,
        });
        await uploadToSignedUrl(signed.uploadUrl, file.uri, file.mimeType);
        attachment = {
          attachmentStorageKey: signed.storageKey,
          attachmentMimeType: file.mimeType,
          attachmentFileSize: file.size,
          attachmentOriginalFilename: generatedFilename,
        };
      }
      return apiFetch('/aid-records', { method: 'POST', body: { ...values, amount: Number(values.amount), ...attachment } });
    },
    onSuccess: async (_data, values) => {
      await queryClient.invalidateQueries({ queryKey: ['aids', values.mosqueId] });
      toast.success(ToastMessages.saveSuccess);
      router.replace({ pathname: '/mosques/[id]', params: { id: values.mosqueId, section: 'aids' } });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : ToastMessages.saveError),
  });

  if (!loading && !token) return <Redirect href="/login" />;

  return (
    <Screen>
      <View>
        <AppText variant="title">إضافة استفادة</AppText>
        <AppText color={colors.muted}>يمكن تعديل السجل لاحقًا إذا احتاج الموظف للتصحيح</AppText>
      </View>
      <AppCard style={styles.form}>
        {!params.mosqueId ? (
          <Controller
            control={control}
            name="mosqueId"
            render={({ field }) => (
              <View style={styles.picker}>
                <SearchBar value={q} onChangeText={setQ} placeholder="ابحث عن المسجد" />
                {(mosques.data as MosqueListRow[] | undefined)?.map((row) => (
                  <AppCard
                    key={row.mosque.id}
                    onPress={() => field.onChange(row.mosque.id)}
                    style={[styles.pick, field.value === row.mosque.id && { borderColor: colors.primary }]}
                  >
                    <AppText>{row.mosque.name}</AppText>
                    <AppText variant="caption" color={colors.info}>رقم {row.mosque.officialCode} - {row.mosque.commune}</AppText>
                  </AppCard>
                ))}
              </View>
            )}
          />
        ) : null}
        <Controller control={control} name="amount" render={({ field }) => <ThemedInput label="المبلغ" keyboardType="numeric" value={String(field.value)} onChangeText={field.onChange} />} />
        <Controller control={control} name="aidDate" render={({ field }) => <DatePickerField label="تاريخ الاستفادة" value={field.value} onChangeText={field.onChange} />} />
        <Controller control={control} name="sourceType" render={({ field }) => <ThemedInput label="المصدر (grant/friday_donations/other)" value={field.value} onChangeText={field.onChange} />} />
        <Controller control={control} name="referenceNumber" render={({ field }) => <ThemedInput label="المرجع" value={field.value} onChangeText={field.onChange} />} />
        <Controller control={control} name="notes" render={({ field }) => <ThemedInput label="ملاحظات" value={field.value} onChangeText={field.onChange} multiline />} />
        <UploadPicker value={files} onChange={(next) => setFiles(next.slice(0, 1))} documentMode compact />
        <ThemedButton title="حفظ الاستفادة" icon={FloppyDisk} disabled={formState.isSubmitting || mutation.isPending} loading={formState.isSubmitting || mutation.isPending} onPress={handleSubmit((values) => mutation.mutate(values))} />
      </AppCard>
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
