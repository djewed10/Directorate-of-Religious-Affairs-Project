import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router, Redirect } from 'expo-router';
import { ArrowRight, FilePlus2, HandCoins, Link, Printer, Save, TrendingUp } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { apiFetch } from '@/api/client';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { DocumentBadge } from '@/components/DocumentBadge';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { ThemedButton } from '@/components/ThemedButton';
import { TimelineCard } from '@/components/TimelineCard';
import { useAuth } from '@/auth/AuthProvider';
import { useAppTheme } from '@/theme/theme';
import type { DocumentRow, Mosque } from '@/types/api';
import { dateAr, money } from '@/utils/format';

const sections = [
  { key: 'overview', label: 'نظرة عامة' },
  { key: 'documents', label: 'الوثائق' },
  { key: 'progression', label: 'التقدم' },
  { key: 'consumption', label: 'الاستهلاك' },
  { key: 'aids', label: 'الاستفادات' },
  { key: 'notes', label: 'الملاحظات' },
  { key: 'settings', label: 'المعلومات' },
];

type DetailResponse = {
  mosque: Mosque;
  association?: { name: string } | null;
  latestProgression?: Record<string, unknown> | null;
  latestConsumption?: Record<string, unknown> | null;
  documentSummary?: { total: number; expired: number; expiringSoon: number; noExpiration: number };
};

export default function MosqueDetailScreen() {
  const { token, loading } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const [section, setSection] = useState('overview');
  const detail = useQuery({ queryKey: ['mosque', id], queryFn: () => api.mosque(id) as Promise<DetailResponse>, enabled: !!id && !!token });
  const wallet = useQuery({ queryKey: ['wallet', id], queryFn: () => api.mosqueWallet(id), enabled: !!id && !!token });
  const progression = useQuery({ queryKey: ['progression', id], queryFn: () => apiFetch<unknown[]>('/progression', { query: { mosqueId: id } }), enabled: !!id && !!token });
  const consumption = useQuery({ queryKey: ['consumption', id], queryFn: () => apiFetch<unknown[]>('/consumption', { query: { mosqueId: id } }), enabled: !!id && !!token });
  const aids = useQuery({ queryKey: ['aids', id], queryFn: () => apiFetch<unknown[]>('/aid-records', { query: { mosqueId: id } }), enabled: !!id && !!token });
  const notes = useQuery({ queryKey: ['notes', id], queryFn: () => apiFetch<unknown[]>('/internal-notes', { query: { mosqueId: id } }), enabled: !!id && !!token });

  const mosque = detail.data?.mosque;
  const allDocs = useMemo(() => ((wallet.data?.all ?? []) as DocumentRow[]), [wallet.data]);

  if (!loading && !token) return <Redirect href="/login" />;
  if (detail.isLoading || !mosque) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ArrowRight color={colors.primary} size={22} />
        </Pressable>
        <View style={styles.title}>
          <AppText variant="title">{mosque.name}</AppText>
          <AppText color={colors.info}>رقم {mosque.officialCode} - بلدية {mosque.commune}</AppText>
        </View>
        <StatusBadge status={mosque.mosqueStatus} />
      </View>

      <FilterChips chips={sections} value={section} onChange={setSection} />

      {section === 'overview' ? (
        <View style={styles.overview}>
          <View style={styles.metrics}>
            <Metric label="نسبة التقدم" value={`${mosque.currentProgressPercent ?? 0}%`} />
            <Metric label="تكلفة الإكمال" value={`${money(mosque.estimatedCompletionCost)} دج`} />
            <Metric label="إجمالي الاستفادات" value={`${money(mosque.totalAidAmount)} دج`} />
            <Metric label="إجمالي الاستهلاك" value={`${money(mosque.totalConsumedAmount)} دج`} />
          </View>
          <AppCard style={styles.card}>
            <AppText variant="subtitle">هوية المسجد</AppText>
            <Info label="الجمعية" value={detail.data?.association?.name ?? 'غير محددة'} />
            <Info label="تبرعات الجمعة" value={mosque.receivesFridayDonations ? 'نعم' : 'لا'} />
            <Info label="آخر استفادة" value={dateAr(mosque.lastAidDate)} />
            <Info label="عدد مرات الاستفادة" value={String(mosque.aidCount)} />
          </AppCard>
          <AppCard style={styles.card}>
            <AppText variant="subtitle">حالة الوثائق</AppText>
            <Info label="المجموع" value={String(detail.data?.documentSummary?.total ?? 0)} />
            <Info label="منتهية" value={String(detail.data?.documentSummary?.expired ?? 0)} tone={colors.danger} />
            <Info label="ستنتهي قريبًا" value={String(detail.data?.documentSummary?.expiringSoon ?? 0)} tone={colors.warning} />
            <Info label="بدون صلاحية" value={String(detail.data?.documentSummary?.noExpiration ?? 0)} tone={colors.info} />
          </AppCard>
          <View style={styles.actions}>
            <ThemedButton title="إضافة وثيقة" icon={FilePlus2} onPress={() => router.push({ pathname: '/documents/new', params: { mosqueId: id } })} />
            <ThemedButton title="إضافة استفادة" icon={HandCoins} tone="neutral" onPress={() => router.push({ pathname: '/aids/new', params: { mosqueId: id } })} />
            <ThemedButton title="طلب تحديث" icon={Link} tone="neutral" onPress={() => router.push({ pathname: '/requests/new', params: { mosqueId: id } })} />
            <ThemedButton title="ملخص للطباعة" icon={Printer} tone="neutral" onPress={() => router.push(`/print/${id}`)} />
          </View>
        </View>
      ) : null}

      {section === 'documents' ? (
        <View style={styles.list}>
          {allDocs.length ? allDocs.map((row) => (
            <AppCard key={row.document.id} style={styles.card}>
              <View style={styles.itemHead}>
                <View style={styles.title}>
                  <AppText variant="subtitle">{row.type.labelAr}</AppText>
                  <AppText variant="caption" color={colors.muted}>{row.document.originalFilename} - نسخة {row.document.currentVersionNumber}</AppText>
                </View>
                <DocumentBadge supportsExpiration={row.type.supportsExpiration} expirationDate={row.document.expirationDate} />
              </View>
            </AppCard>
          )) : <EmptyState title="لا توجد وثائق" />}
        </View>
      ) : null}

      {section === 'progression' ? (
        <View style={styles.list}>
          <ThemedButton title="إضافة تقدم" icon={TrendingUp} onPress={() => router.push({ pathname: '/progression/new', params: { mosqueId: id } })} />
          {(progression.data ?? []).map((item: any) => (
            <TimelineCard key={item.id} title={item.stageCode ?? 'تحديث تقدم'} date={item.createdAt} note={item.shortNote} badge={item.progressPercent !== null ? `${item.progressPercent}%` : undefined} />
          ))}
          {!progression.data?.length ? <EmptyState title="لا توجد تحديثات تقدم" /> : null}
        </View>
      ) : null}

      {section === 'consumption' ? (
        <View style={styles.list}>
          <ThemedButton title="إضافة استهلاك" icon={Save} onPress={() => router.push({ pathname: '/consumption/new', params: { mosqueId: id } })} />
          {(consumption.data ?? []).map((item: any) => (
            <TimelineCard key={item.id} title={`${money(item.withdrawnAmount)} دج`} date={item.createdAt} note={item.shortNote} badge={item.hasCheque ? 'صك مرفق' : 'دون صك'} />
          ))}
          {!consumption.data?.length ? <EmptyState title="لا توجد تحديثات استهلاك" /> : null}
        </View>
      ) : null}

      {section === 'aids' ? (
        <View style={styles.list}>
          {(aids.data ?? []).map((item: any) => (
            <TimelineCard key={item.id} title={`${money(item.amount)} دج`} date={item.aidDate} note={item.notes} badge={item.sourceType ?? undefined} />
          ))}
          {!aids.data?.length ? <EmptyState title="لا توجد استفادات" /> : null}
        </View>
      ) : null}

      {section === 'notes' ? (
        <View style={styles.list}>
          {(notes.data ?? []).map((item: any) => (
            <TimelineCard key={item.id} title="ملاحظة داخلية" date={item.createdAt} note={item.content} badge={item.templateCode ?? undefined} />
          ))}
          {!notes.data?.length ? <EmptyState title="لا توجد ملاحظات داخلية" /> : null}
        </View>
      ) : null}

      {section === 'settings' ? (
        <AppCard style={styles.card}>
          <AppText variant="subtitle">معلومات قابلة للتعديل من شاشة التحرير</AppText>
          <Info label="الدائرة" value={mosque.daira ?? 'غير محددة'} />
          <Info label="الولاية" value={mosque.wilaya ?? 'غير محددة'} />
          <Info label="العنوان" value={mosque.address ?? 'غير محدد'} />
          <ThemedButton title="تعديل بيانات المسجد" tone="neutral" onPress={() => router.push({ pathname: '/mosques/new', params: { id } })} />
        </AppCard>
      ) : null}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <AppCard style={styles.metric}>
      <AppText variant="caption">{label}</AppText>
      <AppText variant="subtitle">{value}</AppText>
    </AppCard>
  );
}

function Info({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.info}>
      <AppText color={colors.muted}>{label}</AppText>
      <AppText color={tone}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  back: {
    padding: 8,
  },
  title: {
    flex: 1,
    gap: 4,
  },
  overview: {
    gap: 10,
  },
  metrics: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  metric: {
    minWidth: 155,
    flex: 1,
    gap: 6,
  },
  card: {
    gap: 10,
  },
  info: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 10,
  },
  actions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  list: {
    gap: 10,
  },
  itemHead: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
});

