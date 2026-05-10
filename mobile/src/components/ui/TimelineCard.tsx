import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppText } from './AppText';
import { StatusBadge } from './StatusBadge';
import { useTheme } from '@/theme/theme';

export function TimelineCard({
  title,
  date,
  note,
  badge,
  index = 0,
  onPress,
}: {
  title: string;
  date?: string;
  note?: string;
  badge?: string;
  index?: number;
  onPress?: () => void;
}) {
  const { colors, radius, spacing } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const rotate = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: withTiming(expanded ? 1 : 0.95, { duration: 120 }) }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(220)} style={styles.timelineRow}>
      <View style={[styles.connector, { backgroundColor: colors.divider, borderRadius: radius.full }]} />
      <Pressable
        onPress={() => {
          if (onPress) {
            onPress();
            return;
          }
          rotate.value = withTiming(expanded ? 0 : 1, { duration: 160 });
          setExpanded((value) => !value);
        }}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.lg }]}
      >
        <View style={styles.head}>
          <View style={styles.titleBlock}>
            <AppText variant="subtitle" numberOfLines={2}>
              {title}
            </AppText>
            {date ? (
              <AppText variant="caption" color={colors.textMuted}>
                {new Date(date).toLocaleDateString('ar-DZ')}
              </AppText>
            ) : null}
          </View>
          {badge ? <StatusBadge status={badge} /> : null}
        </View>
        {note ? (
          <Animated.View style={[{ marginTop: spacing.sm }, animatedStyle]}>
            <AppText color={colors.textSecondary} numberOfLines={expanded ? undefined : 2}>
              {note}
            </AppText>
          </Animated.View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  connector: {
    width: 3,
    marginVertical: 8,
  },
  card: {
    flex: 1,
    borderWidth: 1,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
    gap: 3,
  },
});
