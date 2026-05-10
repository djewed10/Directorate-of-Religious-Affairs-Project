import { PropsWithChildren, ReactNode } from 'react';
import { RefreshControl, ScrollViewProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '@/theme/responsive';
import { useTheme } from '@/theme/theme';

interface Props extends PropsWithChildren {
  scrollable?: boolean;
  scroll?: boolean;
  header?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
}

export function AppScreen({
  children,
  scrollable = true,
  scroll,
  header,
  refreshing,
  onRefresh,
  contentStyle,
  scrollProps,
}: Props) {
  const { colors, spacing } = useTheme();
  const { isWide } = useResponsive();
  const shouldScroll = scroll ?? scrollable;
  const content = (
    <View style={[styles.content, { paddingHorizontal: spacing.lg, gap: spacing.lg }, isWide && styles.wide, contentStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {header}
      {shouldScroll ? (
        <Animated.ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingTop: spacing.lg, paddingBottom: spacing.huge + spacing.xxxl }]}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.primary} />
            ) : undefined
          }
          {...scrollProps}
        >
          {content}
        </Animated.ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  content: {
    width: '100%',
  },
  wide: {
    maxWidth: 1180,
    alignSelf: 'center',
  },
});
