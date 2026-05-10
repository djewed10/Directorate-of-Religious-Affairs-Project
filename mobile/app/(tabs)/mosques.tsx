import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { api } from '@/api/queries';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { Screen } from '@/components/Screen';
import { SearchBar } from '@/components/SearchBar';
import { ThemedButton } from '@/components/ThemedButton';
import { MosqueCard } from '@/components/ui';
import { Plus } from '@/components/ui/icons';
import { useAppTheme } from '@/theme/theme';

const statusFilters = [
  { key: '', label: 'الكل' },
  { key: 'under_construction', label: 'قيد البناء' },
  { key: 'renovation', label: 'قيد الترميم' },
  { key: 'completed', label: 'مكتملة' },
  { key: 'neighborhood_no_friday', label: 'جوارية' },
  { key: 'receives_friday', label: 'تبرعات الجمعة' },
];

const validStatusKeys = new Set(statusFilters.map((item) => item.key));

function normalizeStatusParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return '';
  return validStatusKeys.has(raw) ? raw : '';
}

export default function MosquesScreen() {
  const params = useLocalSearchParams<{ filter?: string }>();
  const { colors } = useAppTheme();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState(normalizeStatusParam(params.filter));
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof api.mosques>>>([]);
  const query = useMemo(() => {
    if (filter === 'receives_friday') return { q, receivesFridayDonations: true, page, limit: 20 };
    return { q, status: filter || undefined, page, limit: 20 };
  }, [filter, page, q]);
  const mosques = useQuery({ queryKey: ['mosques', query], queryFn: () => api.mosques(query) });

  useEffect(() => {
    setFilter(normalizeStatusParam(params.filter));
  }, [params.filter]);

  const handleFilterChange = (nextFilter: string) => {
    const normalized = normalizeStatusParam(nextFilter);
    setFilter(normalized);
    router.push({ pathname: '/mosques', params: normalized ? { filter: normalized } : {} });
  };

  useEffect(() => {
    setPage(1);
    setRows([]);
  }, [filter, q]);

  useEffect(() => {
    if (!mosques.data) return;
    setRows((current) => (page === 1 ? mosques.data : [...current, ...mosques.data]));
  }, [mosques.data, page]);

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
      <FilterChips chips={statusFilters} value={filter} onChange={handleFilterChange} />
      {mosques.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      {!mosques.isLoading && !rows.length ? <EmptyState title="لا توجد نتائج" /> : null}
      <View style={styles.list}>
        {rows.map((row, index) => (
          <MosqueCard key={row.mosque.id} row={row} index={index} onPress={() => router.push(`/mosques/${row.mosque.id}`)} />
        ))}
      </View>
      {(mosques.data?.length ?? 0) === 20 ? (
        <ThemedButton title="تحميل المزيد" tone="neutral" loading={mosques.isFetching && page > 1} onPress={() => setPage((value) => value + 1)} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  list: {
    gap: 10,
  },
});
