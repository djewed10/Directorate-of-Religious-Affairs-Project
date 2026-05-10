import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { CalendarDots } from './icons';
import { useTheme } from '@/theme/theme';

function formatDate(value?: string | null) {
  if (!value) return 'غير محدد';
  return new Date(value).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function DateBadge({ date, prefix }: { date?: string | null; prefix?: string }) {
  const { colors, radius, spacing } = useTheme();
  const target = date ? new Date(date) : null;
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  const past = Boolean(target && target < now);
  const warning = Boolean(target && target >= now && target <= soon);
  const color = past ? colors.danger : warning ? colors.warning : colors.textMuted;
  const bg = past ? colors.dangerSoft : warning ? colors.warningSoft : colors.cardAlt;
  return (
    <View style={[styles.badge, { borderRadius: radius.full, backgroundColor: bg, paddingHorizontal: spacing.sm }]}>
      <CalendarDots size={14} color={color} weight="duotone" />
      <AppText variant="caption" color={color} style={styles.text}>
        {prefix ? `${prefix}: ${formatDate(date)}` : formatDate(date)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 28,
    gap: 5,
  },
  text: {
    fontWeight: '600',
  },
});
