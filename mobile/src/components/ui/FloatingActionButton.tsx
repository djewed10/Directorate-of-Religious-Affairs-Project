import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Icon } from './icons';
import { useTheme } from '@/theme/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FloatingActionButton({ icon: IconComponent, onPress }: { icon: Icon; onPress: () => void }) {
  const { colors, radius } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.94, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 130 });
      }}
      style={[
        styles.fab,
        {
          backgroundColor: colors.primary,
          borderRadius: radius.full,
          shadowColor: colors.shadowStrong,
        },
        animatedStyle,
      ]}
    >
      <IconComponent color={colors.onPrimary} size={28} weight="bold" />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    end: 20,
    bottom: 24,
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 12,
  },
});
