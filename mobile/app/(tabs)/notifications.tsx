import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useAppTheme } from '@/theme/theme';
import { dateAr } from '@/utils/format';

type NotificationRow = {
  id: string;
  titleAr: string;
  bodyAr: string;
  isRead: boolean;
  createdAt: string;
  type: string;
};

export default function NotificationsScreen() {
  const { colors } = useAppTheme();
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: api.notifications });
  const rows = (notifications.data ?? []) as NotificationRow[];
  return (
    <Screen>
      <View>
        <AppText variant="title">التنبيهات</AppText>
        <AppText color={colors.muted}>التنبيهات محفوظة في النظام وهي مصدر الحقيقة</AppText>
      </View>
      {notifications.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      {!notifications.isLoading && !rows.length ? <EmptyState title="لا توجد تنبيهات" icon={Bell} /> : null}
      <View style={styles.list}>
        {rows.map((item) => (
          <AppCard key={item.id} style={[styles.item, !item.isRead && { borderColor: colors.info }]}>
            <AppText variant="subtitle">{item.titleAr}</AppText>
            <AppText color={colors.muted}>{item.bodyAr}</AppText>
            <AppText variant="caption" color={colors.muted}>{dateAr(item.createdAt)}</AppText>
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
    gap: 6,
  },
});

