import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { Screen } from '@/components/Screen';
import { SearchBar } from '@/components/SearchBar';
import { StatusBadge } from '@/components/StatusBadge';
import { ThemedButton } from '@/components/ThemedButton';
import { useAppTheme } from '@/theme/theme';
import { money } from '@/utils/format';

const statusFilters = [
  { key: '', label: 'الكل' },
  { key: 'under_construction', label: 'قيد البناء' },
  { key: 'renovation', label: 'قيد الترميم' },
  { key: 'completed', label: 'مكتملة' },
  { key: 'neighborhood_no_friday', label: 'جوارية' },
  { key: 'receives_friday', label: 'تبرعات الجمعة' },
];

export default function MosquesScreen() {
  const { colors } = useAppTheme();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('');
  const query = useMemo(() => {
    if (filter === 'receives_friday') return { q, receivesFridayDonations: true };
    return { q, status: filter || undefined };
  }, [filter, q]);
  const mosques = useQuery({ queryKey: ['mosques', query], queryFn: () => api.mosques(query) });

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <AppText variant="title">المساجد</AppText>
          <AppText color={colors.muted}>الرقم الرسمي ظاهر دائمًا لتفادي تشابه الأسماء</AppText>
        </View>
        <ThemedButton title="إضافة" icon={Plus} onPress={() => router.push('/mosques/new')} />
      </View>
      <SearchBar value={q} onChangeText={setQ} />
      <FilterChips chips={statusFilters} value={filter} onChange={setFilter} />
      {mosques.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      {!mosques.isLoading && !mosques.data?.length ? <EmptyState title="لا توجد نتائج" /> : null}
      <View style={styles.list}>
        {mosques.data?.map((row) => (
          <AppCard key={row.mosque.id} onPress={() => router.push(`/mosques/${row.mosque.id}`)} style={styles.item}>
            <View style={styles.itemHead}>
              <View style={styles.titleBlock}>
                <AppText variant="subtitle" numberOfLines={1}>{row.mosque.name}</AppText>
                <AppText variant="caption" color={colors.info}>رقم {row.mosque.officialCode} - {row.mosque.commune}</AppText>
              </View>
              <StatusBadge status={row.mosque.mosqueStatus} />
            </View>
            <View style={styles.metrics}>
              <AppText variant="caption" color={colors.muted}>الجمعية: {row.associationName ?? 'غير محددة'}</AppText>
              <AppText variant="caption" color={colors.muted}>الاستفادات: {money(row.mosque.totalAidAmount)} دج</AppText>
              <AppText variant="caption" color={colors.muted}>الاستهلاك: {money(row.mosque.totalConsumedAmount)} دج</AppText>
            </View>
          </AppCard>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  list: {
    gap: 10,
  },
  item: {
    gap: 12,
  },
  itemHead: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  metrics: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
});

