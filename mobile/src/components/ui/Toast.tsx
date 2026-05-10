import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeInDown, FadeOutUp, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { CheckCircle, Info, Warning, WarningCircle } from './icons';
import { useTheme } from '@/theme/theme';

export const ToastMessages = {
  saveSuccess: 'تم الحفظ بنجاح',
  saveError: 'حدث خطأ أثناء الحفظ',
  uploadSuccess: 'تم رفع الوثيقة بنجاح',
  uploadError: 'فشل رفع الملف، حاول مرة أخرى',
  docTypeWarn: 'يرجى اختيار نوع الوثيقة',
  linkCreated: 'تم إنشاء رابط الإرسال',
  linkCopied: 'تم نسخ الرابط',
  deleteSuccess: 'تم الحذف بنجاح',
  deleteError: 'فشل الحذف، حاول مرة أخرى',
  networkError: 'لا يوجد اتصال بالإنترنت',
};

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const show = useCallback((message: string, type: ToastType = 'info') => {
    setItems((current) => [...current, { id: Date.now() + Math.random(), type, message }].slice(-3));
  }, []);
  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);
  const value = useMemo(
    () => ({
      show,
      success: (message: string) => show(message, 'success'),
      error: (message: string) => show(message, 'error'),
      warning: (message: string) => show(message, 'warning'),
      info: (message: string) => show(message, 'info'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}

function ToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  const insets = useSafeAreaInsets();
  const { spacing } = useTheme();
  return (
    <View pointerEvents="box-none" style={[styles.viewport, { paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, gap: spacing.sm }]}>
      {items.map((item) => (
        <ToastRow key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
      ))}
    </View>
  );
}

function ToastRow({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const { colors, radius, spacing, isDark } = useTheme();
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const meta =
    item.type === 'success'
      ? { color: colors.success, soft: colors.successSoft, Icon: CheckCircle }
      : item.type === 'error'
        ? { color: colors.danger, soft: colors.dangerSoft, Icon: WarningCircle }
        : item.type === 'warning'
          ? { color: colors.warning, soft: colors.warningSoft, Icon: Warning }
          : { color: colors.info, soft: colors.infoSoft, Icon: Info };
  const gesture = Gesture.Pan().onEnd((event) => {
    if (event.translationY < -18) runOnJS(onDismiss)();
  });
  const Icon = meta.Icon;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        entering={FadeInDown.duration(220).springify().damping(18)}
        exiting={FadeOutUp.duration(160)}
        style={[
          styles.toast,
          {
            backgroundColor: colors.elevatedSurface,
            borderColor: colors.border,
            borderStartColor: meta.color,
            borderRadius: radius.xl,
            padding: spacing.md,
            shadowColor: colors.shadowStrong,
            shadowOpacity: isDark ? 0 : 1,
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: meta.soft, borderRadius: radius.full }]}>
          <Icon size={18} color={meta.color} weight="duotone" />
        </View>
        <AppText style={styles.message}>{item.message}</AppText>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    zIndex: 1000,
    top: 0,
    start: 0,
    end: 0,
  },
  toast: {
    minHeight: 56,
    borderWidth: 1,
    borderStartWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  iconWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
  },
});
