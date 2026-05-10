import { PropsWithChildren } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { useTheme } from '@/theme/theme';

type TextVariant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'metric' | 'button';

interface Props extends PropsWithChildren {
  variant?: TextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  selectable?: boolean;
}

function variantStyle(variant: TextVariant, theme: ReturnType<typeof useTheme>): TextStyle {
  const { typography } = theme;
  switch (variant) {
    case 'display':
      return {
        fontFamily: typography.families.bold,
        fontSize: typography.sizes.display,
        lineHeight: typography.lineHeights.display,
      };
    case 'title':
      return {
        fontFamily: typography.families.bold,
        fontSize: typography.sizes.title,
        lineHeight: typography.lineHeights.title,
      };
    case 'subtitle':
      return {
        fontFamily: typography.families.semiBold,
        fontSize: typography.sizes.titleSmall,
        lineHeight: typography.lineHeights.titleSmall,
      };
    case 'caption':
      return {
        fontFamily: typography.families.medium,
        fontSize: typography.sizes.caption,
        lineHeight: typography.lineHeights.caption,
      };
    case 'metric':
      return {
        fontFamily: typography.families.bold,
        fontSize: typography.sizes.metric,
        lineHeight: typography.lineHeights.metric,
      };
    case 'button':
      return {
        fontFamily: typography.families.semiBold,
        fontSize: typography.sizes.body,
        lineHeight: typography.lineHeights.body,
      };
    default:
      return {
        fontFamily: typography.families.regular,
        fontSize: typography.sizes.body,
        lineHeight: typography.lineHeights.body,
      };
  }
}

export function AppText({ children, variant = 'body', color, style, numberOfLines, selectable }: Props) {
  const theme = useTheme();
  const { colors } = theme;

  return (
    <Text
      numberOfLines={numberOfLines}
      selectable={selectable}
      style={[
        {
          color: color ?? colors.textPrimary,
          writingDirection: 'rtl',
          textAlign: 'right',
          letterSpacing: 0,
          includeFontPadding: false,
        },
        variantStyle(variant, theme),
        style,
      ]}
    >
      {children}
    </Text>
  );
}
