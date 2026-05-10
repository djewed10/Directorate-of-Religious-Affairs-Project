import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Icon } from './icons';
import { useTheme } from '@/theme/theme';

type Tone = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

export function IconBadge({
  icon: IconComponent,
  tone = 'primary',
  size = 42,
  iconSize = 21,
  rounded = 'square',
  style,
}: {
  icon: Icon;
  tone?: Tone;
  size?: number;
  iconSize?: number;
  rounded?: 'circle' | 'square';
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius, isDark } = useTheme();
  const color = tone === 'muted' ? colors.textMuted : colors[tone];
  const background =
    tone === 'muted'
      ? colors.cardAlt
      : (colors[`${tone}Soft` as keyof typeof colors] as string | undefined) ?? colors.primarySoft;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: rounded === 'circle' ? size / 2 : radius.lg,
          backgroundColor: background,
          borderColor: isDark ? colors.border : colors.transparent,
        },
        isDark && styles.darkBorder,
        style,
      ]}
    >
      <IconComponent size={iconSize} color={color} weight="duotone" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkBorder: {
    borderWidth: 1,
  },
});
