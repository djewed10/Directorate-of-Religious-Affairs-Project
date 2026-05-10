import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from './AppText';
import { ThemedButton } from './ThemedButton';
import { FileMagnifyingGlass, Icon } from './icons';
import { useTheme } from '@/theme/theme';

export function EmptyState({
  title,
  body,
  icon: Icon = FileMagnifyingGlass,
  actionLabel,
  onAction,
}: {
  title: string;
  body?: string;
  icon?: Icon;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors, radius, spacing } = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(220)} style={[styles.wrap, { gap: spacing.md, padding: spacing.xxxl }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft, borderRadius: radius.xxl }]}>
        <Icon size={38} color={colors.primary} weight="duotone" />
      </View>
      <View style={[styles.textBlock, { gap: spacing.xs }]}>
        <AppText variant="subtitle" style={styles.centerText}>
          {title}
        </AppText>
        {body ? (
          <AppText color={colors.textMuted} style={styles.centerText}>
            {body}
          </AppText>
        ) : null}
      </View>
      {actionLabel && onAction ? <ThemedButton title={actionLabel} onPress={onAction} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
});
