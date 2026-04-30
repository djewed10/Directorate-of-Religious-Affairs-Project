import { StyleSheet, View } from 'react-native';
import { AppCard } from './AppCard';
import { AppText } from './AppText';
import { useAppTheme } from '@/theme/theme';

export function TimelineCard({ title, date, note, badge }: { title: string; date?: string; note?: string; badge?: string }) {
  const { colors } = useAppTheme();
  return (
    <AppCard style={styles.card}>
      <View style={styles.head}>
        <AppText variant="subtitle">{title}</AppText>
        {badge ? <AppText variant="caption" color={colors.info}>{badge}</AppText> : null}
      </View>
      {date ? <AppText variant="caption" color={colors.muted}>{new Date(date).toLocaleDateString('ar-DZ')}</AppText> : null}
      {note ? <AppText color={colors.muted}>{note}</AppText> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
  },
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});

