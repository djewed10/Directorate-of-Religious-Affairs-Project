import { PropsWithChildren } from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends PropsWithChildren {
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  noPadding?: boolean;
  enteringDelay?: number;
}

export function AppCard({ children, onPress, onLongPress, style, padded = true, noPadding, enteringDelay = 0 }: Props) {
  const { colors, radius, spacing, isDark } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const baseStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.xl,
      padding: noPadding || !padded ? 0 : spacing.lg,
      shadowColor: colors.shadow,
      shadowOpacity: isDark ? 0 : 1,
      elevation: isDark ? 0 : 2,
    },
    isDark && styles.darkCard,
    style,
  ];

  if (onPress || onLongPress) {
    return (
      <AnimatedPressable
        entering={FadeInDown.delay(enteringDelay).duration(220)}
        onLongPress={onLongPress}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: 100 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 120 });
        }}
        style={[baseStyle, animatedStyle]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(enteringDelay).duration(220)} style={baseStyle}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  darkCard: {
    shadowRadius: 0,
  },
});
