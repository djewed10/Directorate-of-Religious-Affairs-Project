import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { api } from '@/api/queries';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { Screen } from '@/components/Screen';
import { SearchBar } from '@/components/SearchBar';
import { MosqueCard } from '@/components/ui';
import { ThemedButton } from '@/components/ThemedButton';
import { useAppTheme } from '@/theme/theme';
import type { MosqueListRow } from '@/types/api';

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

const validFilterKeys = new Set(filters.map((item) => item.key));

function normalizeFilterParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return '';
  return validFilterKeys.has(raw) ? raw : '';
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{ filter?: string }>();
  const { colors } = useAppTheme();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState(normalizeFilterParam(params.filter));
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<MosqueListRow[]>([]);
  const query = useMemo(() => ({ q, filter: filter || undefined, page, limit: 20 }), [filter, page, q]);
  const results = useQuery({ queryKey: ['search', query], queryFn: () => api.search(query) });

  useEffect(() => {
    setFilter(normalizeFilterParam(params.filter));
  }, [params.filter]);

  const handleFilterChange = (nextFilter: string) => {
    const normalized = normalizeFilterParam(nextFilter);
    setFilter(normalized);
    router.push({ pathname: '/search', params: normalized ? { filter: normalized } : {} });
  };

  useEffect(() => {
    setPage(1);
    setRows([]);
  }, [filter, q]);

  useEffect(() => {
    if (!results.data) return;
    setRows((current) => (page === 1 ? results.data : [...current, ...results.data]));
  }, [page, results.data]);

  return (
    <Screen>
      <View>
        <AppText variant="title">بحث ذكي</AppText>
        <AppText color={colors.muted}>بحث بالرقم الرسمي، اسم المسجد، الجمعية، البلدية أو حالة الوثيقة</AppText>
      </View>
      <SearchBar value={q} onChangeText={setQ} />
      <FilterChips chips={filters} value={filter} onChange={handleFilterChange} />
      {results.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      {!results.isLoading && !rows.length ? <EmptyState title="لا توجد نتائج مطابقة" /> : null}
      <View style={styles.list}>
        {rows.map((row, index) => (
          <MosqueCard key={row.mosque.id} row={row} index={index} onPress={() => router.push(`/mosques/${row.mosque.id}`)} />
        ))}
      </View>
      {(results.data?.length ?? 0) === 20 ? (
        <ThemedButton title="تحميل المزيد" tone="neutral" loading={results.isFetching && page > 1} onPress={() => setPage((value) => value + 1)} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
});
