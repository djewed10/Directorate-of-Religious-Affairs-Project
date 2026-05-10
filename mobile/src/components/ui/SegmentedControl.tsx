import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { AppText } from './AppText';
import { useTheme } from '@/theme/theme';

export interface SegmentOption {
  key: string;
  label: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: SegmentOption[];
  value: string;
  onChange: (key: string) => void;
}) {
  const { colors, radius, spacing, isDark } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.cardAlt, borderRadius: radius.full, padding: spacing.xs }]}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable key={option.key} onPress={() => onChange(option.key)} style={styles.item}>
            {active ? (
              <Animated.View
                layout={LinearTransition.springify().damping(18)}
                style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? colors.surface : colors.white, borderRadius: radius.full }]}
              />
            ) : null}
            <AppText variant="caption" color={active ? colors.primary : colors.textMuted} style={styles.label}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    textAlign: 'center',
    fontWeight: '600',
  },
});
