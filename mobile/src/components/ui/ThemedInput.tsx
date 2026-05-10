import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppText } from './AppText';
import { Icon } from './icons';
import { useTheme } from '@/theme/theme';

interface Props extends TextInputProps {
  label?: string;
  icon?: Icon;
  onIconPress?: () => void;
  error?: string;
}

export function ThemedInput({ label, icon: Icon, onIconPress, error, style, value, onFocus, onBlur, ...props }: Props) {
  const { colors, radius, spacing, typography } = useTheme();
  const [focused, setFocused] = useState(false);
  const glow = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: error ? colors.danger : glow.value > 0.5 ? colors.primary : colors.border,
  }));

  return (
    <View style={[styles.wrap, { gap: spacing.xs }]}>
      {label ? (
        <AppText variant="caption" color={focused || value ? colors.primary : colors.textSecondary}>
          {label}
        </AppText>
      ) : null}
      <Animated.View
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.md,
          },
          animatedStyle,
        ]}
      >
        {Icon ? (
          <Pressable onPress={onIconPress} disabled={!onIconPress} style={styles.icon}>
            <Icon size={20} color={focused ? colors.primary : colors.textMuted} weight={focused ? 'duotone' : 'regular'} />
          </Pressable>
        ) : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          value={value}
          onFocus={(event) => {
            setFocused(true);
            glow.value = withTiming(1, { duration: 160 });
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            glow.value = withTiming(0, { duration: 160 });
            onBlur?.(event);
          }}
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              fontFamily: typography.families.regular,
              minHeight: props.multiline ? 94 : 50,
              textAlignVertical: props.multiline ? 'top' : 'center',
            },
            style,
          ]}
          textAlign="right"
          {...props}
        />
      </Animated.View>
      {error ? (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  inputWrap: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    writingDirection: 'rtl',
    paddingVertical: 0,
  },
  icon: {
    padding: 6,
  },
});
