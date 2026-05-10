import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppText } from './AppText';
import { Icon } from './icons';
import { useTheme } from '@/theme/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface FilterChipItem {
  key: string;
  label: string;
  icon?: Icon;
}

export function FilterChip({
  chip,
  active,
  onPress,
}: {
  chip: FilterChipItem;
  active?: boolean;
  onPress: () => void;
}) {
  const { colors, radius, spacing } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const Icon = chip.icon;
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      style={[
        styles.chip,
        {
          borderRadius: radius.full,
          backgroundColor: active ? colors.primary : colors.cardAlt,
          borderColor: active ? colors.primary : colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.content, { gap: spacing.xs }]}>
        {Icon ? <Icon size={16} color={active ? colors.onPrimary : colors.textSecondary} weight={active ? 'bold' : 'regular'} /> : null}
        <AppText variant="caption" color={active ? colors.onPrimary : colors.textSecondary} style={styles.label}>
          {chip.label}
        </AppText>
      </View>
    </AnimatedPressable>
  );
}

export function FilterChips({
  chips,
  value,
  onChange,
}: {
  chips: FilterChipItem[];
  value?: string;
  onChange: (key: string) => void;
}) {
  const { spacing } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, { gap: spacing.sm }]}>
      {chips.map((chip) => (
        <FilterChip key={chip.key} chip={chip} active={chip.key === value} onPress={() => onChange(chip.key)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  chip: {
    borderWidth: 1,
    minHeight: 36,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
  },
});
