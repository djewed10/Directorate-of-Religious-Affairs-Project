import { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { AppCard } from './AppCard';
import { AppText } from './AppText';
import { useAppTheme } from '@/theme/theme';

interface Props {
  title: string;
  value: string | number;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  icon?: LucideIcon;
  onPress?: () => void;
}

export function StatCard({ title, value, tone = 'primary', icon: Icon, onPress }: Props) {
  const { colors } = useAppTheme();
  const color = colors[tone];
  return (
    <AppCard onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        {Icon ? <Icon size={22} color={color} /> : null}
        <AppText variant="caption" color={colors.muted}>{title}</AppText>
      </View>
      <AppText variant="metric" color={color}>{value}</AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 150,
    flex: 1,
    gap: 10,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 8,
  },
});

