import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Save } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { apiFetch } from '@/api/client';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { DatePickerField } from '@/components/DatePickerField';
import { Screen } from '@/components/Screen';
import { SearchBar } from '@/components/SearchBar';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { useAuth } from '@/auth/AuthProvider';
import { useAppTheme } from '@/theme/theme';
import type { MosqueListRow } from '@/types/api';

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
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const mosques = useQuery({ queryKey: ['aid-mosques', q], queryFn: () => api.mosques({ q, limit: 8 }), enabled: !!token && !params.mosqueId });
  const { control, handleSubmit, formState } = useForm<AidForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      mosqueId: params.mosqueId ?? '',
      amount: '',
      aidDate: new Date().toISOString().slice(0, 10),
      sourceType: 'grant',
      referenceNumber: '',
      notes: '',
    },
  });
  const mutation = useMutation({
    mutationFn: (values: AidForm) =>
      apiFetch('/aid-records', { method: 'POST', body: { ...values, amount: Number(values.amount) } }),
    onSuccess: async (_data, values) => {
      await queryClient.invalidateQueries({ queryKey: ['aids', values.mosqueId] });
      router.replace(`/mosques/${values.mosqueId}`);
    },
    onError: (error) => Alert.alert('تعذر الحفظ', error instanceof Error ? error.message : 'خطأ غير معروف'),
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
        <ThemedButton title="حفظ الاستفادة" icon={Save} disabled={formState.isSubmitting || mutation.isPending} onPress={handleSubmit((values) => mutation.mutate(values))} />
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
