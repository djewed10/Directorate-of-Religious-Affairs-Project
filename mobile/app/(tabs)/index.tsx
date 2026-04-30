import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  Banknote,
  BellRing,
  ClipboardPlus,
  FileClock,
  FilePlus2,
  FileWarning,
  HandCoins,
  Landmark,
  Link,
  Plus,
  Search,
  TimerReset,
  TrendingUp,
} from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { QuickActionCard } from '@/components/QuickActionCard';
import { Screen } from '@/components/Screen';
import { StatCard } from '@/components/StatCard';
import { useAppTheme } from '@/theme/theme';
import { useResponsive } from '@/theme/responsive';
import { money } from '@/utils/format';

export default function DashboardScreen() {
  const { colors } = useAppTheme();
  const { isWide } = useResponsive();
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: api.dashboard });

  if (dashboard.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (!dashboard.data) {
    return (
      <Screen>
        <EmptyState title="لا توجد بيانات" body="شغل seed للبدء ببيانات تجريبية." />
      </Screen>
    );
  }

  const cards = dashboard.data.cards;
  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <AppText variant="title">لوحة المتابعة</AppText>
          <AppText color={colors.muted}>تركيز سريع على الوثائق، الاستهلاك والمساجد النشطة</AppText>
        </View>
        <AppCard onPress={() => router.push('/notifications')} style={styles.alertPill}>
          <BellRing color={colors.info} size={19} />
          <AppText variant="caption" color={colors.info}>مركز التنبيهات</AppText>
        </AppCard>
      </View>

      <View style={[styles.grid, isWide && styles.gridWide]}>
        <StatCard title="وثائق منتهية" value={cards.expiredDocuments ?? 0} tone="danger" icon={FileWarning} onPress={() => router.push({ pathname: '/search', params: { filter: 'expired_documents' } })} />
        <StatCard title="ستنتهي قريبًا" value={cards.expiringSoonDocuments ?? 0} tone="warning" icon={FileClock} onPress={() => router.push({ pathname: '/search', params: { filter: 'expiring_soon' } })} />
        <StatCard title="إجمالي الاستهلاك" value={`${money(cards.totalConsumedAmount)} دج`} tone="info" icon={Banknote} />
        <StatCard title="المتبقي تقديريًا" value={`${money(cards.remainingEstimate)} دج`} tone={cards.remainingEstimate < 0 ? 'danger' : 'success'} icon={HandCoins} />
        <StatCard title="قيد البناء" value={cards.underConstruction ?? 0} tone="warning" icon={Landmark} onPress={() => router.push({ pathname: '/search', params: { filter: 'under_construction' } })} />
        <StatCard title="قيد الترميم" value={cards.renovation ?? 0} tone="warning" icon={TimerReset} onPress={() => router.push({ pathname: '/search', params: { filter: 'renovation' } })} />
        <StatCard title="مكتملة" value={cards.completed ?? 0} tone="success" icon={Landmark} onPress={() => router.push({ pathname: '/search', params: { filter: 'completed' } })} />
        <StatCard title="جوارية بدون جمعة" value={cards.neighborhoodNoFriday ?? 0} tone="info" icon={Landmark} onPress={() => router.push({ pathname: '/search', params: { filter: 'neighborhood_no_friday' } })} />
      </View>

      <View style={styles.sectionHead}>
        <AppText variant="subtitle">إجراءات سريعة</AppText>
      </View>
      <View style={styles.actions}>
        <QuickActionCard title="إضافة مسجد" subtitle="مع OCR للرقم الرسمي" icon={Plus} onPress={() => router.push('/mosques/new')} />
        <QuickActionCard title="إضافة وثيقة" subtitle="نوع محدد ورفع سريع" icon={FilePlus2} onPress={() => router.push('/documents/new')} />
        <QuickActionCard title="إرسال طلب تحديث" subtitle="رابط آمن للجمعية" icon={Link} onPress={() => router.push('/requests/new')} />
        <QuickActionCard title="إرسال طلب استهلاك" subtitle="صك وفواتير وصور" icon={ClipboardPlus} onPress={() => router.push({ pathname: '/requests/new', params: { type: 'consumption_control' } })} />
        <QuickActionCard title="طلب تجديد وثيقة" subtitle="تجديد عبر رمز مؤقت" icon={FileClock} onPress={() => router.push({ pathname: '/requests/new', params: { type: 'document_renewal' } })} />
        <QuickActionCard title="بحث عن مسجد" subtitle="بالرقم أو الاسم أو البلدية" icon={Search} onPress={() => router.push('/search')} />
        <QuickActionCard title="إضافة استفادة" subtitle="سجل مالي قابل للتصحيح" icon={HandCoins} onPress={() => router.push('/aids/new')} />
        <QuickActionCard title="آخر تقدم" subtitle="صور ومراحل الأشغال" icon={TrendingUp} onPress={() => router.push('/progression')} />
      </View>

      <View style={[styles.columns, isWide && styles.columnsWide]}>
        <TopList title="Top à suivre" rows={dashboard.data.top.needFollowUp.map((m) => ({ id: m.id, title: m.name, subtitle: `رقم ${m.officialCode} - ${m.commune}` }))} />
        <TopList title="وثائق منتهية" rows={dashboard.data.top.expiredDocuments.map((m) => ({ id: m.mosqueId, title: m.name, subtitle: `رقم ${m.officialCode} - ${m.expiredCount} وثيقة` }))} />
        <TopList title="نشاط حديث" rows={dashboard.data.top.recentActivity.map((m) => ({ id: m.id, title: m.name, subtitle: `رقم ${m.officialCode} - ${m.commune}` }))} />
      </View>
    </Screen>
  );
}

function TopList({ title, rows }: { title: string; rows: Array<{ id: string; title: string; subtitle: string }> }) {
  const { colors } = useAppTheme();
  return (
    <AppCard style={styles.topCard}>
      <AppText variant="subtitle">{title}</AppText>
      {rows.length ? (
        rows.map((row) => (
          <AppCard key={row.id} onPress={() => router.push(`/mosques/${row.id}`)} style={styles.topItem}>
            <AppText>{row.title}</AppText>
            <AppText variant="caption" color={colors.muted}>{row.subtitle}</AppText>
          </AppCard>
        ))
      ) : (
        <AppText color={colors.muted}>لا توجد عناصر حاليًا</AppText>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  alertPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridWide: {
    alignItems: 'stretch',
  },
  sectionHead: {
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  columns: {
    gap: 10,
  },
  columnsWide: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
  },
  topCard: {
    gap: 10,
    flex: 1,
  },
  topItem: {
    gap: 4,
    padding: 10,
    shadowOpacity: 0,
    elevation: 0,
  },
});

