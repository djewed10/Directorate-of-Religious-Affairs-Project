import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Archive, CheckCircle, Clock, FileText, FileX, Question, Sparkle, WarningCircle } from './icons';
import { useTheme } from '@/theme/theme';
import type { MosqueStatusCode } from '@/types/api';

const mosqueLabels: Record<MosqueStatusCode, string> = {
  under_construction: 'قيد البناء',
  completed: 'مكتمل',
  renovation: 'قيد الترميم',
  neighborhood_no_friday: 'جواري بدون جمعة',
  light_follow_up: 'متابعة خفيفة',
  archived: 'مؤرشف',
};

export function statusLabel(status?: string) {
  const normalized = status ?? '';
  if (normalized === 'active' || normalized === 'فعال') return 'فعال';
  if (normalized === 'pending' || normalized === 'قيد الانتظار') return 'قيد الانتظار';
  if (normalized === 'expired' || normalized === 'منتهية') return 'منتهية';
  if (normalized === 'archived' || normalized === 'مؤرشف') return 'مؤرشف';
  if (normalized === 'new' || normalized === 'جديد') return 'جديد';
  return mosqueLabels[normalized as MosqueStatusCode] ?? status ?? 'غير محدد';
}

function statusTone(status: string | undefined, colors: ReturnType<typeof useTheme>['colors']) {
  const normalized = status ?? '';
  if (normalized === 'completed' || normalized === 'active' || normalized === 'فعال') {
    return { color: colors.success, soft: colors.successSoft, Icon: CheckCircle };
  }
  if (normalized === 'renovation' || normalized === 'under_construction' || normalized === 'pending' || normalized === 'قيد الانتظار') {
    return { color: colors.warning, soft: colors.warningSoft, Icon: Clock };
  }
  if (normalized === 'expired' || normalized === 'منتهية') {
    return { color: colors.danger, soft: colors.dangerSoft, Icon: WarningCircle };
  }
  if (normalized === 'archived' || normalized === 'مؤرشف') {
    return { color: colors.textMuted, soft: colors.cardAlt, Icon: Archive };
  }
  if (normalized === 'new' || normalized === 'جديد') {
    return { color: colors.info, soft: colors.infoSoft, Icon: Sparkle };
  }
  return { color: colors.info, soft: colors.infoSoft, Icon: CheckCircle };
}

export function StatusBadge({ status }: { status?: string }) {
  const { colors, radius, spacing } = useTheme();
  const { color, soft, Icon } = statusTone(status, colors);
  return (
    <View style={[styles.badge, { borderRadius: radius.full, backgroundColor: soft, paddingHorizontal: spacing.sm }]}>
      <Icon size={14} color={color} weight="duotone" />
      <AppText variant="caption" color={color} style={styles.text}>
        {statusLabel(status)}
      </AppText>
    </View>
  );
}

const documentMap = {
  uploaded: { label: 'مرفوعة', icon: FileText, tone: 'success' },
  pending_review: { label: 'قيد المراجعة', icon: Clock, tone: 'warning' },
  approved: { label: 'معتمدة', icon: CheckCircle, tone: 'success' },
  rejected: { label: 'مرفوضة', icon: FileX, tone: 'danger' },
  expired: { label: 'منتهية', icon: WarningCircle, tone: 'danger' },
  missing: { label: 'ناقصة', icon: Question, tone: 'warning' },
} as const;

export function DocumentStatusBadge({ state }: { state: keyof typeof documentMap }) {
  const { colors, radius, spacing } = useTheme();
  const item = documentMap[state] ?? documentMap.missing;
  const color = colors[item.tone];
  const soft = colors[`${item.tone}Soft` as keyof typeof colors] as string;
  const Icon = item.icon;
  return (
    <View style={[styles.badge, { borderRadius: radius.full, backgroundColor: soft, paddingHorizontal: spacing.sm }]}>
      <Icon size={14} color={color} weight="duotone" />
      <AppText variant="caption" color={color} style={styles.text}>
        {item.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
    gap: 5,
  },
  text: {
    fontWeight: '600',
  },
});
