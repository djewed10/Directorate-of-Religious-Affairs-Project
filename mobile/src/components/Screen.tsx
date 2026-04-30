import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme/theme';
import { useResponsive } from '@/theme/responsive';

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const { colors } = useAppTheme();
  const { isWide } = useResponsive();
  const content = <View style={[styles.content, isWide && styles.wide]}>{children}</View>;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingVertical: 14,
  },
  content: {
    width: '100%',
    paddingHorizontal: 14,
    gap: 14,
  },
  wide: {
    maxWidth: 1180,
    alignSelf: 'center',
  },
});

