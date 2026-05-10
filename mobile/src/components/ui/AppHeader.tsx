import { ReactNode } from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { AppText } from './AppText';
import { ArrowLeft } from './icons';
import { useTheme } from '@/theme/theme';

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  transparent?: boolean;
  centered?: boolean;
}

export function AppHeader({ title, subtitle, showBack, leftAction, rightAction, transparent, centered }: Props) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: transparent ? colors.transparent : colors.background,
          borderBottomColor: transparent ? colors.transparent : colors.border,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
      ]}
    >
      <View style={styles.actionSlot}>
        {rightAction ??
          (showBack ? (
            <Pressable onPress={() => router.back()} style={styles.iconButton}>
              <ArrowLeft color={colors.primary} size={22} weight="bold" style={I18nManager.isRTL ? styles.flipIcon : undefined} />
            </Pressable>
          ) : null)}
      </View>
      <Animated.View entering={FadeIn.duration(180)} style={[styles.titleBlock, centered && styles.centered]}>
        <AppText variant="subtitle" numberOfLines={1} style={centered ? styles.centerText : undefined}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textMuted} numberOfLines={1} style={centered ? styles.centerText : undefined}>
            {subtitle}
          </AppText>
        ) : null}
      </Animated.View>
      <View style={[styles.actionSlot, styles.leftSlot]}>{leftAction}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 62,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionSlot: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftSlot: {
    alignItems: 'flex-start',
  },
  titleBlock: {
    flex: 1,
    gap: 3,
  },
  centered: {
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipIcon: {
    transform: [{ scaleX: -1 }],
  },
});
