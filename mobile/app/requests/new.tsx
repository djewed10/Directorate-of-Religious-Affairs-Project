import { useMutation, useQuery } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Link as LinkIcon, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { apiFetch } from '@/api/client';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { DatePickerField } from '@/components/DatePickerField';
import { FilterChips } from '@/components/FilterChips';
import { SearchBar } from '@/components/SearchBar';
import { Screen } from '@/components/Screen';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { useAuth } from '@/auth/AuthProvider';
import { useAppTheme } from '@/theme/theme';
import type { MosqueListRow } from '@/types/api';

const requestTypes = [
  { key: 'consumption_control', label: 'طلب استهلاك' },
  { key: 'progression_update', label: 'تحديث تقدم' },
  { key: 'document_renewal', label: 'تجديد وثيقة' },
  { key: 'document_upload', label: 'رفع وثيقة' },
  { key: 'cover_image_update', label: 'صورة الغلاف' },
];

export default function NewRequestScreen() {
  const { token, loading } = useAuth();
  const params = useLocalSearchParams<{ mosqueId?: string; type?: string }>();
  const { colors } = useAppTheme();
  const [q, setQ] = useState('');
  const [mosqueId, setMosqueId] = useState(params.mosqueId ?? '');
  const [type, setType] = useState(params.type ?? 'consumption_control');
  const [expiresInDays, setExpiresInDays] = useState('14');
  const [result, setResult] = useState<{ externalUrl: string; shortCode?: string } | null>(null);
  const mosques = useQuery({ queryKey: ['request-mosques', q], queryFn: () => api.mosques({ q, limit: 8 }), enabled: !!token && !params.mosqueId });
  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<{ externalUrl: string; shortCode?: string }>('/external-update-requests', {
        method: 'POST',
        body: {
          mosqueId,
          requestType: type,
          expiresInDays: Number(expiresInDays || 14),
          allowProgressionFields: type === 'consumption_control',
          allowCoverUpdate: type === 'cover_image_update',
        },
      }),
    onSuccess: setResult,
    onError: (error) => Alert.alert('تعذر إنشاء الطلب', error instanceof Error ? error.message : 'خطأ غير معروف'),
  });

  if (!loading && !token) return <Redirect href="/login" />;

  return (
    <Screen>
      <View>
        <AppText variant="title">طلب خارجي آمن</AppText>
        <AppText color={colors.muted}>الجمعية تحصل على نموذج محدود بدون حساب كامل</AppText>
      </View>
      <AppCard style={styles.card}>
        {!params.mosqueId ? (
          <>
            <SearchBar value={q} onChangeText={setQ} placeholder="ابحث عن المسجد" />
            {(mosques.data as MosqueListRow[] | undefined)?.map((row) => (
              <AppCard key={row.mosque.id} onPress={() => setMosqueId(row.mosque.id)} style={[styles.pick, mosqueId === row.mosque.id && { borderColor: colors.primary }]}>
                <AppText>{row.mosque.name}</AppText>
                <AppText variant="caption" color={colors.info}>رقم {row.mosque.officialCode} - {row.mosque.commune}</AppText>
              </AppCard>
            ))}
          </>
        ) : null}
        <AppText variant="caption" color={colors.muted}>نوع الطلب</AppText>
        <FilterChips chips={requestTypes} value={type} onChange={setType} />
        <ThemedInput label="مدة الصلاحية بالأيام" keyboardType="numeric" value={expiresInDays} onChangeText={setExpiresInDays} />
        <ThemedButton title="إنشاء الرابط" icon={Send} disabled={!mosqueId || mutation.isPending} onPress={() => mutation.mutate()} />
      </AppCard>
      {result ? (
        <AppCard style={styles.result}>
          <LinkIcon color={colors.info} size={22} />
          <AppText variant="subtitle">الرابط جاهز</AppText>
          <AppText selectable color={colors.info}>{result.externalUrl}</AppText>
          {result.shortCode ? <AppText>الكود المختصر: {result.shortCode}</AppText> : null}
        </AppCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  pick: {
    gap: 4,
    shadowOpacity: 0,
    elevation: 0,
  },
  result: {
    gap: 8,
  },
});

