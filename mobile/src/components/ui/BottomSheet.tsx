import { PropsWithChildren, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useTheme } from '@/theme/theme';

export type BottomSheetRef = {
  present: () => void;
  dismiss: () => void;
};

interface Props extends PropsWithChildren {
  visible?: boolean;
  onClose: () => void;
  snapPoints?: Array<string | number>;
}

export const BottomSheet = forwardRef<BottomSheetRef, Props>(function BottomSheet({ visible, onClose, snapPoints, children }, ref) {
  const { colors, radius, spacing } = useTheme();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const points = useMemo(() => normalizeSnapPoints(snapPoints ?? ['38%', '72%']), [snapPoints]);

  const present = useCallback(() => {
    bottomSheetRef.current?.present();
    isPresentedRef.current = true;
  }, []);

  const dismiss = useCallback(() => {
    if (isPresentedRef.current) {
      bottomSheetRef.current?.dismiss();
    }
  }, []);

  useImperativeHandle(ref, () => ({ present, dismiss }), [dismiss, present]);

  useEffect(() => {
    if (visible) {
      present();
      return;
    }

    if (visible === false) dismiss();
  }, [dismiss, present, visible]);

  const handleDismiss = useCallback(() => {
    isPresentedRef.current = false;
    if (visible) onClose();
  }, [onClose, visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
        pressBehavior="close"
        style={[props.style, { backgroundColor: colors.overlay }]}
      />
    ),
    [colors.overlay],
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={points}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      enableHandlePanningGesture
      enableContentPanningGesture
      enableOverDrag
      animateOnMount
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={[
        styles.sheetBackground,
        {
          backgroundColor: colors.elevatedSurface,
          borderColor: colors.border,
          borderTopLeftRadius: radius.xxl,
          borderTopRightRadius: radius.xxl,
        },
      ]}
      handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: colors.border }]}
    >
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.lg }]}
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

function normalizeSnapPoints(points: Array<string | number>) {
  return points.map((point) => {
    if (typeof point === 'number') return point;
    const trimmed = point.trim();
    if (trimmed.endsWith('%')) return trimmed;
    if (trimmed.endsWith('px')) return Number(trimmed.slice(0, -2)) || '72%';
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : '72%';
  });
}

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopWidth: 1,
  },
  handleIndicator: {
    width: 44,
    height: 5,
    borderRadius: 100,
  },
  content: {
    flexGrow: 1,
    paddingTop: 8,
  },
});
