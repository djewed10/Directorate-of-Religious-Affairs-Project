import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
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
import { useAppTheme } from '@/theme/theme';

const filters = [
  { key: '', label: 'كل النتائج' },
  { key: 'expired_documents', label: 'وثائق منتهية' },
  { key: 'expiring_soon', label: 'ستنتهي قريبًا' },
  { key: 'needs_progress_update', label: 'تحتاج تقدم' },
  { key: 'no_update_two_months', label: 'شهرين بدون تحديث' },
  { key: 'old_last_aid', label: 'آخر استفادة قديمة' },
  { key: 'under_construction', label: 'قيد البناء' },
  { key: 'renovation', label: 'قيد الترميم' },
  { key: 'completed', label: 'مكتملة' },
  { key: 'receives_friday', label: 'تستفيد الجمعة' },
  { key: 'no_friday', label: 'لا تستفيد الجمعة' },
];

export default function SearchScreen() {
  const params = useLocalSearchParams<{ filter?: string }>();
  const { colors } = useAppTheme();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState(params.filter ?? '');
  const query = useMemo(() => ({ q, filter: filter || undefined }), [filter, q]);
  const results = useQuery({ queryKey: ['search', query], queryFn: () => api.search(query) });

  return (
    <Screen>
      <View>
        <AppText variant="title">بحث ذكي</AppText>
        <AppText color={colors.muted}>بحث بالرقم الرسمي، اسم المسجد، الجمعية، البلدية أو حالة الوثيقة</AppText>
      </View>
      <SearchBar value={q} onChangeText={setQ} />
      <FilterChips chips={filters} value={filter} onChange={setFilter} />
      {results.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      {!results.isLoading && !results.data?.length ? <EmptyState title="لا توجد نتائج مطابقة" /> : null}
      <View style={styles.list}>
        {results.data?.map((row) => (
          <AppCard key={row.mosque.id} onPress={() => router.push(`/mosques/${row.mosque.id}`)} style={styles.item}>
            <View style={styles.itemHead}>
              <View style={styles.titleBlock}>
                <AppText variant="subtitle">{row.mosque.name}</AppText>
                <AppText variant="caption" color={colors.info}>رقم {row.mosque.officialCode} - {row.mosque.commune}</AppText>
              </View>
              <StatusBadge status={row.mosque.mosqueStatus} />
            </View>
            <AppText variant="caption" color={colors.muted}>الجمعية: {row.associationName ?? 'غير محددة'}</AppText>
          </AppCard>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  item: {
    gap: 8,
  },
  itemHead: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
  },
});

