import { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { AppCard } from './AppCard';
import { AppText } from './AppText';
import { useAppTheme } from '@/theme/theme';

interface Props {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  onPress?: () => void;
}

export function QuickActionCard({ title, subtitle, icon: Icon, onPress }: Props) {
  const { colors, radii } = useAppTheme();
  return (
    <AppCard onPress={onPress} style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft, borderRadius: radii.md }]}>
        <Icon color={colors.primary} size={22} />
      </View>
      <View style={styles.text}>
        <AppText variant="subtitle" numberOfLines={2}>{title}</AppText>
        {subtitle ? <AppText variant="caption" color={colors.muted} numberOfLines={2}>{subtitle}</AppText> : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 165,
    minHeight: 96,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 4,
  },
});

