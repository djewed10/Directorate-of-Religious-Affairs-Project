import { useQuery } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { apiFetch } from '@/api/client';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TimelineCard } from '@/components/TimelineCard';
import { useAuth } from '@/auth/AuthProvider';
import { useAppTheme } from '@/theme/theme';

export default function ProgressionScreen() {
  const { token, loading } = useAuth();
  const { colors } = useAppTheme();
  const progression = useQuery({ queryKey: ['progression-latest'], queryFn: () => apiFetch<any[]>('/progression'), enabled: !!token });
  if (!loading && !token) return <Redirect href="/login" />;
  return (
    <Screen>
      <View>
        <AppText variant="title">آخر تحديثات التقدم</AppText>
        <AppText color={colors.muted}>أحدث الصور والمراحل من كل المساجد</AppText>
      </View>
      {progression.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      <View style={styles.list}>
        {progression.data?.map((item) => (
          <TimelineCard key={item.id} title={item.stageCode ?? 'تحديث تقدم'} date={item.createdAt} note={item.shortNote} badge={item.progressPercent !== null ? `${item.progressPercent}%` : undefined} />
        ))}
      </View>
      {!progression.isLoading && !progression.data?.length ? <EmptyState title="لا توجد تحديثات" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
});

