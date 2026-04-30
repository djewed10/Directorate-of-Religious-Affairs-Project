import { LucideIcon } from 'lucide-react-native';
import { TextInput, TextInputProps, View, StyleSheet, Pressable } from 'react-native';
import { AppText } from './AppText';
import { useAppTheme } from '@/theme/theme';

interface Props extends TextInputProps {
  label?: string;
  icon?: LucideIcon;
  onIconPress?: () => void;
  error?: string;
}

export function ThemedInput({ label, icon: Icon, onIconPress, error, style, ...props }: Props) {
  const { colors, radii } = useAppTheme();
  return (
    <View style={styles.wrap}>
      {label ? <AppText variant="caption" color={colors.muted}>{label}</AppText> : null}
      <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border, borderRadius: radii.md }]}>
        {Icon ? (
          <Pressable onPress={onIconPress} disabled={!onIconPress} style={styles.icon}>
            <Icon size={20} color={colors.primary} />
          </Pressable>
        ) : null}
        <TextInput
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text }, style]}
          textAlign="right"
          {...props}
        />
      </View>
      {error ? <AppText variant="caption" color={colors.danger}>{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  inputWrap: {
    minHeight: 48,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    writingDirection: 'rtl',
  },
  icon: {
    padding: 4,
  },
});

