import { useQuery } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/auth/AuthProvider';
import { useAppTheme } from '@/theme/theme';
import type { Mosque } from '@/types/api';
import { dateAr, money } from '@/utils/format';

type DetailResponse = {
  mosque: Mosque;
  association?: { name: string } | null;
  documentSummary?: { total: number; expired: number; expiringSoon: number; noExpiration: number };
};

export default function PrintSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, loading } = useAuth();
  const { colors } = useAppTheme();
  const detail = useQuery({ queryKey: ['print-mosque', id], queryFn: () => api.mosque(id) as Promise<DetailResponse>, enabled: !!id && !!token });
  if (!loading && !token) return <Redirect href="/login" />;
  const mosque = detail.data?.mosque;
  return (
    <Screen>
      {Platform.OS === 'web' ? (
        <Pressable onPress={() => window.print()} style={[styles.printButton, { backgroundColor: colors.primary }]}>
          <AppText color="#FFFFFF">طباعة</AppText>
        </Pressable>
      ) : null}
      {mosque ? (
        <AppCard style={styles.summary}>
          <View style={styles.header}>
            <View style={styles.title}>
              <AppText variant="title">{mosque.name}</AppText>
              <AppText color={colors.info}>رقم {mosque.officialCode} - بلدية {mosque.commune}</AppText>
            </View>
            <StatusBadge status={mosque.mosqueStatus} />
          </View>
          <Info label="الجمعية" value={detail.data?.association?.name ?? 'غير محددة'} />
          <Info label="تبرعات الجمعة" value={mosque.receivesFridayDonations ? 'نعم' : 'لا'} />
          <Info label="تكلفة الإكمال المقدرة" value={`${money(mosque.estimatedCompletionCost)} دج`} />
          <Info label="إجمالي الاستفادات" value={`${money(mosque.totalAidAmount)} دج`} />
          <Info label="إجمالي الاستهلاك" value={`${money(mosque.totalConsumedAmount)} دج`} />
          <Info label="آخر استفادة" value={dateAr(mosque.lastAidDate)} />
          <Info label="نسبة التقدم" value={`${mosque.currentProgressPercent ?? 0}%`} />
          <Info label="الوثائق المنتهية" value={String(detail.data?.documentSummary?.expired ?? 0)} />
          <Info label="الوثائق التي ستنتهي قريبًا" value={String(detail.data?.documentSummary?.expiringSoon ?? 0)} />
        </AppCard>
      ) : null}
    </Screen>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.info}>
      <AppText color={colors.muted}>{label}</AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  printButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  summary: {
    gap: 12,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    gap: 4,
  },
  info: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
  },
});

