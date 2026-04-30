import { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { useAppTheme } from '@/theme/theme';

interface Props {
  title: string;
  onPress?: () => void;
  icon?: LucideIcon;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  disabled?: boolean;
}

export function ThemedButton({ title, onPress, icon: Icon, tone = 'primary', disabled }: Props) {
  const { colors, radii } = useAppTheme();
  const bg =
    tone === 'success'
      ? colors.success
      : tone === 'warning'
        ? colors.warning
        : tone === 'danger'
          ? colors.danger
          : tone === 'neutral'
            ? colors.surfaceMuted
            : colors.primary;
  const textColor = tone === 'neutral' ? colors.text : '#FFFFFF';
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderRadius: radii.md, opacity: disabled ? 0.5 : pressed ? 0.86 : 1 },
      ]}
    >
      <View style={styles.content}>
        {Icon ? <Icon size={18} color={textColor} /> : null}
        <AppText color={textColor} style={styles.label}>
          {title}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
  },
  label: {
    fontWeight: '800',
  },
});

