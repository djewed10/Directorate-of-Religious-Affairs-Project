import { PropsWithChildren } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { useAppTheme } from '@/theme/theme';

interface Props extends PropsWithChildren {
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'metric';
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  selectable?: boolean;
}

export function AppText({ children, variant = 'body', color, style, numberOfLines, selectable }: Props) {
  const { colors } = useAppTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      selectable={selectable}
      style={[
        {
          color: color ?? colors.text,
          writingDirection: 'rtl',
          textAlign: 'right',
          fontWeight: variant === 'title' || variant === 'metric' ? '800' : variant === 'subtitle' ? '700' : '500',
          fontSize: variant === 'title' ? 24 : variant === 'metric' ? 26 : variant === 'subtitle' ? 17 : variant === 'caption' ? 12 : 14,
          lineHeight: variant === 'title' ? 34 : variant === 'metric' ? 34 : variant === 'subtitle' ? 24 : variant === 'caption' ? 18 : 22,
          letterSpacing: 0,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
