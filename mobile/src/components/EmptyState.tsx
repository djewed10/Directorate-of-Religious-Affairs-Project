import { LucideIcon, Inbox } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { useAppTheme } from '@/theme/theme';

export function EmptyState({ title, body, icon: Icon = Inbox }: { title: string; body?: string; icon?: LucideIcon }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrap}>
      <Icon size={36} color={colors.muted} />
      <AppText variant="subtitle">{title}</AppText>
      {body ? <AppText color={colors.muted}>{body}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 8,
  },
});

