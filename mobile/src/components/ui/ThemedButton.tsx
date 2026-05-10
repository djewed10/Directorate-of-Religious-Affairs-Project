import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppText } from './AppText';
import { Icon } from './icons';
import { useTheme } from '@/theme/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  title: string;
  onPress?: () => void;
  icon?: Icon;
  tone?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
  disabled?: boolean;
  loading?: boolean;
}

export function ThemedButton({ title, onPress, icon: Icon, tone = 'primary', disabled, loading }: Props) {
  const { colors, radius, spacing } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bg =
    tone === 'success'
      ? colors.success
      : tone === 'warning'
        ? colors.warning
        : tone === 'danger'
          ? colors.danger
          : tone === 'secondary'
            ? colors.secondary
            : tone === 'neutral'
              ? colors.cardAlt
              : colors.primary;
  const textColor = tone === 'neutral' ? colors.textPrimary : colors.onPrimary;
  const iconColor = tone === 'neutral' ? colors.primary : colors.onPrimary;

  return (
    <AnimatedPressable
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      style={[
        styles.button,
        {
          backgroundColor: bg,
          borderRadius: radius.full,
          opacity: disabled ? 0.55 : 1,
          paddingHorizontal: spacing.lg,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.content, { gap: spacing.sm }]}>
        {loading ? <ActivityIndicator color={textColor} size="small" /> : Icon ? <Icon size={19} color={iconColor} weight="bold" /> : null}
        <AppText color={textColor} variant="button" style={styles.label}>
          {title}
        </AppText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  label: {
    textAlign: 'center',
  },
});
