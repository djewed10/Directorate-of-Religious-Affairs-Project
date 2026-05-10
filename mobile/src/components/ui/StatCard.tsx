import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppCard } from './AppCard';
import { AppText } from './AppText';
import { IconBadge } from './IconBadge';
import { Icon } from './icons';
import { useTheme } from '@/theme/theme';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary';
  icon?: Icon;
  onPress?: () => void;
}

export function StatCard({ title, value, subtitle, tone = 'primary', icon: Icon, onPress }: Props) {
  const { colors, spacing } = useTheme();
  const color = colors[tone];
  const animatedValue = useSharedValue(0);
  const [display, setDisplay] = useState(typeof value === 'number' ? 0 : value);

  useEffect(() => {
    if (typeof value === 'number') animatedValue.value = withTiming(value, { duration: 650 });
    else setDisplay(value);
  }, [animatedValue, value]);

  useAnimatedReaction(
    () => animatedValue.value,
    (current) => {
      if (typeof value === 'number') runOnJS(setDisplay)(Math.round(current));
    },
    [value],
  );

  return (
    <AppCard onPress={onPress} style={styles.card}>
      <View style={styles.topBar}>
        {Icon ? <IconBadge icon={Icon} tone={tone} size={40} iconSize={19} rounded="square" /> : null}
        <View style={styles.textBlock}>
          <AppText variant="caption" color={colors.textSecondary}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color={colors.textMuted}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
      <Animated.View style={{ marginTop: spacing.sm }}>
        <AppText variant="metric" color={color}>
          {display}
        </AppText>
      </Animated.View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 150,
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
});
