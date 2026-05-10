import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { apiFetch } from '@/api/client';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { Screen } from '@/components/Screen';
import { AnimatedModal, ThemedButton, ToastMessages, useToast } from '@/components/ui';
import { Bell, FileText, PaperPlaneTilt, Receipt, Trash, TrendUp, WarningCircle, type Icon } from '@/components/ui/icons';
import { navigateFromNotification } from '@/notifications/navigation';
import { useAppTheme } from '@/theme/theme';
import { dateAr } from '@/utils/format';

type NotificationRow = {
  id: string;
  titleAr: string;
  bodyAr: string;
  isRead: boolean;
  createdAt: string;
  type: string;
  mosqueId?: string | null;
  mosqueName?: string | null;
  officialCode?: string | null;
  commune?: string | null;
  metadataJson?: Record<string, unknown> | null;
};

const filters = [
  { key: 'all', label: 'الكل' },
  { key: 'unread', label: 'غير مقروءة' },
  { key: 'documents', label: 'الوثائق' },
  { key: 'consumption', label: 'الاستهلاك' },
  { key: 'progression', label: 'التقدم' },
  { key: 'external', label: 'طلبات خارجية' },
];

const validFilterKeys = new Set(filters.map((f) => f.key));

function normalizeFilterParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return 'all';
  return validFilterKeys.has(raw) ? raw : 'all';
}

const categoryOrder = ['documents', 'consumption', 'progression', 'external', 'general'] as const;
const categoryLabels: Record<(typeof categoryOrder)[number], string> = {
  documents: 'وثائق',
  consumption: 'استهلاك',
  progression: 'تقدم الأشغال',
  external: 'طلبات خارجية',
  general: 'تنبيهات عامة',
};

export default function NotificationsScreen() {
  const params = useLocalSearchParams<{ filter?: string }>();
  const { colors } = useAppTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState(normalizeFilterParam(params.filter));
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<NotificationRow | null>(null);
  const notifications = useQuery({ queryKey: ['notifications', page], queryFn: () => api.notifications({ page: 1, limit: page * 30 }) });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/notifications/${id}`, { method: 'DELETE' }),
    onSuccess: async (_payload, id) => {
      queryClient.setQueryData<NotificationRow[]>(['notifications'], (current) => (current ?? []).filter((item) => item.id !== id));
      queryClient.setQueryData<NotificationRow[]>(['notifications', page], (current) => (current ?? []).filter((item) => item.id !== id));
      setDeleteTarget(null);
      toast.success(ToastMessages.deleteSuccess);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : ToastMessages.deleteError),
  });

  const rows = useMemo(() => {
    const source = ((notifications.data ?? []) as NotificationRow[]).filter((item) => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !item.isRead;
      return categoryOf(item.type) === filter;
    });
    return source.sort((a, b) => Number(a.isRead) - Number(b.isRead) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filter, notifications.data]);

  useEffect(() => {
    setFilter(normalizeFilterParam(params.filter));
  }, [params.filter]);

  const handleFilterChange = (next: string) => {
    const normalized = normalizeFilterParam(next);
    setFilter(normalized);
    router.push({ pathname: '/notifications', params: normalized && normalized !== 'all' ? { filter: normalized } : {} });
  };

  const grouped = useMemo(() => {
    return categoryOrder.map((category) => ({
      category,
      groups: groupByTime(rows.filter((item) => categoryOf(item.type) === category)),
    }));
  }, [rows]);

  async function openNotification(item: NotificationRow) {
    markReadInCache(queryClient, item.id, page);
    await navigateFromNotification({ ...item, metadataJson: item.metadataJson });
  }

  return (
    <Screen onRefresh={() => notifications.refetch()} refreshing={notifications.isRefetching}>
      <View>
        <AppText variant="title">التنبيهات</AppText>
        <AppText color={colors.muted}>اضغط على التنبيه لفتح الملف المرتبط مباشرة.</AppText>
      </View>
      <FilterChips chips={filters} value={filter} onChange={handleFilterChange} />
      {notifications.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      {!notifications.isLoading && !rows.length ? <EmptyState title="لا توجد تنبيهات" icon={Bell} /> : null}

      {grouped.map(({ category, groups }) =>
        groups.length ? (
          <View key={category} style={styles.category}>
            <AppText variant="subtitle">{categoryLabels[category]}</AppText>
            {groups.map((group) => (
              <NotificationGroup
                key={`${category}-${group.label}`}
                title={group.label}
                rows={group.rows}
                onOpen={openNotification}
                onDelete={setDeleteTarget}
              />
            ))}
          </View>
        ) : null,
      )}
      {((notifications.data as NotificationRow[] | undefined)?.length ?? 0) >= page * 30 ? (
        <ThemedButton title="تحميل المزيد" tone="neutral" loading={notifications.isFetching} onPress={() => setPage((value) => value + 1)} />
      ) : null}

      <AnimatedModal
        visible={Boolean(deleteTarget)}
        danger
        title="حذف التنبيه؟"
        message="سيتم حذف هذا التنبيه من القائمة."
        confirmLabel="حذف"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </Screen>
  );
}

function markReadInCache(queryClient: ReturnType<typeof useQueryClient>, id: string, page: number) {
  const markRows = (current?: NotificationRow[]) => (current ?? []).map((row) => (row.id === id ? { ...row, isRead: true } : row));
  queryClient.setQueryData<NotificationRow[]>(['notifications'], markRows);
  queryClient.setQueryData<NotificationRow[]>(['notifications', page], markRows);
  queryClient.setQueryData<{ count: number }>(['unread-notifications'], (current) => ({
    count: Math.max(0, (current?.count ?? 1) - 1),
  }));
}

function NotificationGroup({
  title,
  rows,
  onOpen,
  onDelete,
}: {
  title: string;
  rows: NotificationRow[];
  onOpen: (row: NotificationRow) => void;
  onDelete: (row: NotificationRow) => void;
}) {
  if (!rows.length) return null;
  return (
    <View style={styles.list}>
      <AppText variant="caption">{title}</AppText>
      {rows.map((item) => (
        <NotificationCard key={item.id} item={item} onOpen={() => onOpen(item)} onDelete={() => onDelete(item)} />
      ))}
    </View>
  );
}

function NotificationCard({ item, onOpen, onDelete }: { item: NotificationRow; onOpen: () => void; onDelete: () => void }) {
  const { colors } = useAppTheme();
  const IconComponent = iconForType(item.type);
  return (
    <AppCard
      onPress={onOpen}
      style={[
        styles.item,
        {
          opacity: item.isRead ? 0.72 : 1,
          borderColor: item.isRead ? colors.border : colors.info,
          backgroundColor: item.isRead ? colors.card : colors.infoSoft,
        },
      ]}
    >
      <View style={styles.notificationHead}>
        <View style={[styles.iconWrap, { backgroundColor: colors.card }]}>
          <IconComponent size={20} color={colors.primary} weight="duotone" />
        </View>
        <View style={styles.notificationTitle}>
          <View style={styles.titleLine}>
            {!item.isRead ? <View style={[styles.dot, { backgroundColor: colors.info }]} /> : null}
            <AppText variant="subtitle" numberOfLines={2}>
              {item.titleAr}
            </AppText>
          </View>
          <AppText color={colors.textSecondary} numberOfLines={3}>
            {item.bodyAr}
          </AppText>
        </View>
        <Pressable onPress={onDelete} style={styles.deleteButton}>
          <Trash size={18} color={colors.danger} weight="duotone" />
        </Pressable>
      </View>
      <View style={styles.meta}>
        <AppText variant="caption" color={colors.textMuted}>
          {item.mosqueName ?? 'مسجد غير محدد'}
        </AppText>
        <AppText variant="caption" color={colors.textMuted}>
          رقم {item.officialCode ?? '-'} - {item.commune ?? '-'}
        </AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {dateAr(item.createdAt)}
        </AppText>
      </View>
    </AppCard>
  );
}

function groupByTime(rows: NotificationRow[]) {
  const today: NotificationRow[] = [];
  const week: NotificationRow[] = [];
  const older: NotificationRow[] = [];
  rows.forEach((item) => {
    const age = Date.now() - new Date(item.createdAt).getTime();
    if (new Date(item.createdAt).toDateString() === new Date().toDateString()) today.push(item);
    else if (age <= 7 * 24 * 60 * 60 * 1000) week.push(item);
    else older.push(item);
  });
  return [
    { label: 'اليوم', rows: today },
    { label: 'هذا الأسبوع', rows: week },
    { label: 'أقدم', rows: older },
  ].filter((group) => group.rows.length);
}

function categoryOf(type: string) {
  if (type.startsWith('document_')) return 'documents';
  if (type === 'consumption_update') return 'consumption';
  if (type === 'progression_update') return 'progression';
  if (type.startsWith('external_')) return 'external';
  return 'general';
}

function iconForType(type: string): Icon {
  if (type.startsWith('document_')) return FileText;
  if (type === 'consumption_update') return Receipt;
  if (type === 'progression_update') return TrendUp;
  if (type.startsWith('external_')) return PaperPlaneTilt;
  return WarningCircle;
}

const styles = StyleSheet.create({
  category: {
    gap: 10,
  },
  list: {
    gap: 10,
  },
  item: {
    gap: 10,
  },
  notificationHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTitle: {
    flex: 1,
    gap: 4,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 99,
  },
  deleteButton: {
    padding: 8,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
