import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Icon } from './icons';
import { useTheme } from '@/theme/theme';

type Tone = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

/**
 * ImageIconBadge renders an image asset as a clean, borderless icon.
 * Falls back to a vector icon if the image fails to load.
 * No background container—image displays directly.
 */
export function ImageIconBadge({
  source,
  fallbackIcon,
  tone = 'primary',
  size = 56,
  imageSize = 48,
  rounded = 'square',
  style,
}: {
  source: any; // Image source from require()
  fallbackIcon: Icon;
  tone?: Tone;
  size?: number;
  imageSize?: number;
  rounded?: 'circle' | 'square';
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const [hasError, setHasError] = useState(false);
  const color = tone === 'muted' ? colors.textMuted : colors[tone];
  const FallbackIcon = fallbackIcon;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: rounded === 'circle' ? size / 2 : 8,
        },
        style,
      ]}
    >
      {!hasError ? (
        <Image
          source={source}
          style={{
            width: imageSize,
            height: imageSize,
          }}
          contentFit="contain"
          transition={180}
          onError={() => setHasError(true)}
        />
      ) : FallbackIcon ? (
        <FallbackIcon size={imageSize} color={color} weight="duotone" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
