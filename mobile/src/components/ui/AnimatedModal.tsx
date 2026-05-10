import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { AppText } from './AppText';
import { ThemedButton } from './ThemedButton';
import { useTheme } from '@/theme/theme';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AnimatedModal({
  visible,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  danger,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  const { colors, radius, spacing } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <Animated.View
          entering={ZoomIn.duration(180)}
          exiting={ZoomOut.duration(140)}
          style={[styles.dialog, { backgroundColor: colors.elevatedSurface, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg }]}
        >
          <View style={{ gap: spacing.sm }}>
            <AppText variant="subtitle">{title}</AppText>
            {message ? <AppText color={colors.textSecondary}>{message}</AppText> : null}
          </View>
          <View style={[styles.actions, { gap: spacing.sm }]}>
            <ThemedButton title={cancelLabel} tone="neutral" onPress={onCancel} disabled={loading} />
            <ThemedButton title={confirmLabel} tone={danger ? 'danger' : 'primary'} onPress={onConfirm} loading={loading} disabled={loading} />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
