import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { useAppTheme } from '@/theme/theme';
import type { MosqueStatusCode } from '@/types/api';

const labels: Record<MosqueStatusCode, string> = {
  under_construction: 'قيد البناء',
  completed: 'مكتمل',
  renovation: 'قيد الترميم',
  neighborhood_no_friday: 'جواري بدون جمعة',
  light_follow_up: 'متابعة خفيفة',
  archived: 'أرشيف',
};

export function statusLabel(status?: string) {
  return labels[status as MosqueStatusCode] ?? status ?? 'غير محدد';
}

export function StatusBadge({ status }: { status?: string }) {
  const { colors, radii } = useAppTheme();
  const tone =
    status === 'completed'
      ? colors.success
      : status === 'renovation' || status === 'under_construction'
        ? colors.warning
        : status === 'archived'
          ? colors.muted
          : colors.info;
  return (
    <View style={[styles.badge, { borderRadius: radii.sm, backgroundColor: `${tone}22`, borderColor: `${tone}66` }]}>
      <AppText variant="caption" color={tone} style={styles.text}>{statusLabel(status)}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '800',
  },
});

