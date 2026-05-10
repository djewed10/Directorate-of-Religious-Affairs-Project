import * as Clipboard from 'expo-clipboard';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { apiFetch } from '@/api/client';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { FilterChips } from '@/components/FilterChips';
import { SearchBar } from '@/components/SearchBar';
import { Screen } from '@/components/Screen';
import { DatePickerField } from '@/components/DatePickerField';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { useAuth } from '@/auth/AuthProvider';
import { BottomSheet, ToastMessages, useToast } from '@/components/ui';
import { Copy, Link as LinkIcon, PaperPlaneTilt, ShareNetwork } from '@/components/ui/icons';
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
  const toast = useToast();
  const [q, setQ] = useState('');
  const [mosqueId, setMosqueId] = useState(params.mosqueId ?? '');
  const [type, setType] = useState(params.type ?? 'consumption_control');
  const [expiresInDays, setExpiresInDays] = useState('14');
  const [expiresAt, setExpiresAt] = useState('');
  const [result, setResult] = useState<{ externalUrl: string; shortCode?: string } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const mosques = useQuery({ queryKey: ['request-mosques', q], queryFn: () => api.mosques({ q, limit: 8 }), enabled: !!token && !params.mosqueId });
  const mutation = useMutation({
    mutationFn: () => {
      const days = Number(expiresInDays || 14);
      if (!expiresAt && days > 100) throw new Error('أقصى مدة مسموحة هي 100 يوم');
      if (!expiresAt && days < 1) throw new Error('أقل مدة مسموحة هي يوم واحد');
      if (expiresAt) {
        const expiry = new Date(expiresAt);
        const max = new Date();
        max.setDate(max.getDate() + 100);
        if (expiry > max) throw new Error('أقصى مدة مسموحة هي 100 يوم');
        if (expiry < new Date()) throw new Error('تاريخ انتهاء الطلب غير صالح');
      }
      return apiFetch<{ externalUrl: string; shortCode?: string }>('/external-update-requests', {
        method: 'POST',
        body: {
          mosqueId,
          requestType: type,
          expiresInDays: expiresAt ? undefined : days,
          expiresAt: expiresAt || undefined,
          allowProgressionFields: type === 'consumption_control',
          allowCoverUpdate: type === 'cover_image_update',
        },
      });
    },
    onSuccess: (payload) => {
      setResult(payload);
      toast.success(ToastMessages.linkCreated);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : ToastMessages.saveError),
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
        <ThemedInput
          label="مدة الصلاحية بالأيام"
          keyboardType="numeric"
          value={expiresInDays}
          onChangeText={(value) => {
            setExpiresInDays(value);
            if (Number(value) > 100) toast.error('أقصى مدة مسموحة هي 100 يوم');
          }}
        />
        <DatePickerField label="تاريخ انتهاء الرابط اختياري" value={expiresAt} onChangeText={setExpiresAt} />
        <ThemedButton title="إنشاء الرابط" icon={PaperPlaneTilt} disabled={!mosqueId || mutation.isPending} loading={mutation.isPending} onPress={() => mutation.mutate()} />
      </AppCard>
      {result ? (
        <AppCard style={styles.result}>
          <LinkIcon color={colors.info} size={22} weight="duotone" />
          <AppText variant="subtitle">الرابط جاهز</AppText>
          <AppText selectable color={colors.info}>{result.externalUrl}</AppText>
          {result.shortCode ? <AppText>الكود المختصر: {result.shortCode}</AppText> : null}
          <View style={styles.shareRow}>
            <ThemedButton
              title="نسخ الرابط"
              icon={Copy}
              tone="neutral"
              onPress={async () => {
                await Clipboard.setStringAsync(result.externalUrl);
                toast.success(ToastMessages.linkCopied);
              }}
            />
            <ThemedButton title="مشاركة" icon={ShareNetwork} onPress={() => setShareOpen(true)} />
          </View>
        </AppCard>
      ) : null}
      <BottomSheet visible={shareOpen} onClose={() => setShareOpen(false)} snapPoints={['30%', '46%']}>
        <AppText variant="subtitle">إرسال الرابط</AppText>
        <ThemedButton
          title="نسخ"
          icon={Copy}
          tone="neutral"
          onPress={async () => {
            if (!result?.externalUrl) return;
            await Clipboard.setStringAsync(result.externalUrl);
            toast.success(ToastMessages.linkCopied);
            setShareOpen(false);
          }}
        />
        <ThemedButton
          title="مشاركة"
          icon={ShareNetwork}
          onPress={async () => {
            if (!result?.externalUrl) return;
            await Share.share({ message: result.externalUrl });
            setShareOpen(false);
          }}
        />
      </BottomSheet>
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
  shareRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
