import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Camera, Save } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { apiFetch } from '@/api/client';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { DatePickerField } from '@/components/DatePickerField';
import { FilterChips } from '@/components/FilterChips';
import { Screen } from '@/components/Screen';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { useAuth } from '@/auth/AuthProvider';
import { scanImageForOcr } from '@/ocr/ocrService';
import { useAppTheme } from '@/theme/theme';

const schema = z.object({
  officialCode: z.string().min(2),
  name: z.string().min(2),
  commune: z.string().min(2),
  daira: z.string().optional(),
  wilaya: z.string().optional(),
  address: z.string().optional(),
  mosqueStatus: z.string(),
  receivesFridayDonations: z.boolean(),
  currentProgressPercent: z.string().optional(),
  estimatedTotalProjectCost: z.string().optional(),
  estimatedCompletionCost: z.string().optional(),
});

type MosqueForm = z.infer<typeof schema>;

export default function MosqueFormScreen() {
  const { token, loading } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const reference = useQuery({ queryKey: ['reference'], queryFn: api.reference, enabled: !!token });
  const existing = useQuery({
    queryKey: ['mosque-edit', params.id],
    queryFn: () => api.mosque(params.id!) as Promise<any>,
    enabled: !!params.id && !!token,
  });
  const { control, handleSubmit, setValue, watch, reset, formState } = useForm<MosqueForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      officialCode: '',
      name: '',
      commune: '',
      daira: '',
      wilaya: '',
      address: '',
      mosqueStatus: 'under_construction',
      receivesFridayDonations: true,
      currentProgressPercent: '0',
      estimatedTotalProjectCost: '0',
      estimatedCompletionCost: '0',
    },
  });

  if (existing.data?.mosque && watch('officialCode') === '') {
    reset({
      officialCode: existing.data.mosque.officialCode,
      name: existing.data.mosque.name,
      commune: existing.data.mosque.commune,
      daira: existing.data.mosque.daira ?? '',
      wilaya: existing.data.mosque.wilaya ?? '',
      address: existing.data.mosque.address ?? '',
      mosqueStatus: existing.data.mosque.mosqueStatus,
      receivesFridayDonations: existing.data.mosque.receivesFridayDonations,
      currentProgressPercent: String(existing.data.mosque.currentProgressPercent ?? 0),
      estimatedTotalProjectCost: String(existing.data.mosque.estimatedTotalProjectCost ?? 0),
      estimatedCompletionCost: String(existing.data.mosque.estimatedCompletionCost ?? 0),
    });
  }

  const mutation = useMutation({
    mutationFn: (values: MosqueForm) =>
      apiFetch(params.id ? `/mosques/${params.id}` : '/mosques', {
        method: params.id ? 'PATCH' : 'POST',
        body: {
          ...values,
          currentProgressPercent: values.currentProgressPercent ? Number(values.currentProgressPercent) : undefined,
          estimatedTotalProjectCost: values.estimatedTotalProjectCost ? Number(values.estimatedTotalProjectCost) : undefined,
          estimatedCompletionCost: values.estimatedCompletionCost ? Number(values.estimatedCompletionCost) : undefined,
        },
      }),
    onSuccess: async (created: any) => {
      await queryClient.invalidateQueries({ queryKey: ['mosques'] });
      router.replace(`/mosques/${params.id ?? created.id}`);
    },
    onError: (error) => Alert.alert('تعذر الحفظ', error instanceof Error ? error.message : 'خطأ غير معروف'),
  });

  if (!loading && !token) return <Redirect href="/login" />;

  async function runOcr() {
    const result = await scanImageForOcr(reference.data?.ocrConfig?.officialCodeRegex);
    const code = result?.officialCodeCandidates[0];
    const expiry = result?.expirationDateCandidates[0];
    if (!code && !expiry) return;
    Alert.alert('تم العثور على قيم', `الرقم: ${code ?? 'غير موجود'}\nتاريخ: ${expiry ?? 'غير موجود'}`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'استعمال الرقم', onPress: () => code && setValue('officialCode', code) },
    ]);
  }

  const statuses =
    reference.data?.statuses.map((status) => ({ key: status.code, label: status.labelAr })) ?? [
      { key: 'under_construction', label: 'قيد البناء' },
    ];

  return (
    <Screen>
      <View>
        <AppText variant="title">{params.id ? 'تعديل مسجد' : 'إضافة مسجد'}</AppText>
        <AppText color={colors.muted}>الرقم الرسمي هو المفتاح العملي عند تشابه الأسماء</AppText>
      </View>
      <AppCard style={styles.form}>
        <Controller
          control={control}
          name="officialCode"
          render={({ field, fieldState }) => (
            <ThemedInput
              label="الرقم الرسمي"
              value={field.value}
              onChangeText={field.onChange}
              icon={Camera}
              onIconPress={runOcr}
              placeholder="مثال: 2026-001"
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller control={control} name="name" render={({ field, fieldState }) => <ThemedInput label="اسم المسجد" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />} />
        <Controller control={control} name="commune" render={({ field, fieldState }) => <ThemedInput label="البلدية" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />} />
        <View style={styles.row}>
          <Controller control={control} name="daira" render={({ field }) => <ThemedInput label="الدائرة" value={field.value} onChangeText={field.onChange} />} />
          <Controller control={control} name="wilaya" render={({ field }) => <ThemedInput label="الولاية" value={field.value} onChangeText={field.onChange} />} />
        </View>
        <Controller control={control} name="address" render={({ field }) => <ThemedInput label="العنوان" value={field.value} onChangeText={field.onChange} />} />
        <AppText variant="caption" color={colors.muted}>حالة المسجد</AppText>
        <FilterChips
          chips={statuses}
          value={watch('mosqueStatus')}
          onChange={(status) => {
            setValue('mosqueStatus', status);
            const defaultFriday = reference.data?.statuses.find((item) => item.code === status)?.receivesFridayDonationsDefault;
            if (defaultFriday !== undefined) setValue('receivesFridayDonations', defaultFriday);
          }}
        />
        <FilterChips
          chips={[
            { key: 'true', label: 'يستفيد من الجمعة' },
            { key: 'false', label: 'لا يستفيد من الجمعة' },
          ]}
          value={String(watch('receivesFridayDonations'))}
          onChange={(value) => setValue('receivesFridayDonations', value === 'true')}
        />
        <View style={styles.row}>
          <Controller control={control} name="currentProgressPercent" render={({ field }) => <ThemedInput label="نسبة التقدم %" keyboardType="numeric" value={String(field.value ?? '')} onChangeText={field.onChange} />} />
          <Controller control={control} name="estimatedCompletionCost" render={({ field }) => <ThemedInput label="تكلفة الإكمال" keyboardType="numeric" value={String(field.value ?? '')} onChangeText={field.onChange} />} />
        </View>
        <Controller control={control} name="estimatedTotalProjectCost" render={({ field }) => <ThemedInput label="التكلفة الإجمالية المقدرة" keyboardType="numeric" value={String(field.value ?? '')} onChangeText={field.onChange} />} />
        <ThemedButton title="حفظ" icon={Save} disabled={formState.isSubmitting || mutation.isPending} onPress={handleSubmit((values) => mutation.mutate(values))} />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  row: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
});
