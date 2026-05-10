import { StyleSheet, View } from 'react-native';
import { AppCard } from './AppCard';
import { AppText } from './AppText';
import { IconBadge } from './IconBadge';
import { Icon } from './icons';
import { useTheme } from '@/theme/theme';

interface Props {
  title: string;
  subtitle?: string;
  icon: Icon;
  tone?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  onPress?: () => void;
}

export function QuickActionCard({ title, subtitle, icon: Icon, tone = 'primary', onPress }: Props) {
  const { colors, spacing } = useTheme();
  return (
    <AppCard onPress={onPress} style={[styles.card, { gap: spacing.sm }]} enteringDelay={40}>
      <IconBadge icon={Icon} tone={tone} size={40} iconSize={19} />
      <View style={styles.text}>
        <AppText variant="caption" style={styles.title} numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textMuted} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 138,
    minHeight: 116,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    alignItems: 'center',
    gap: 3,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
  },
});
