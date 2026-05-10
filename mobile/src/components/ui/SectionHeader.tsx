import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '@/theme/theme';

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={[styles.row, { marginTop: spacing.xs }]}>
      <AppText variant="subtitle">{title}</AppText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <AppText variant="caption" color={colors.primary}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
