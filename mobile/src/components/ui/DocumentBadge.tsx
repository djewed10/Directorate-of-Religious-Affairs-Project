import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { CheckCircle, ClockCountdown, WarningOctagon } from './icons';
import { useTheme } from '@/theme/theme';

export function DocumentBadge({ supportsExpiration, expirationDate }: { supportsExpiration: boolean; expirationDate?: string | null }) {
  const { colors, radius, spacing } = useTheme();
  let label = 'بدون تاريخ انتهاء';
  let color = colors.textMuted;
  let bg = colors.cardAlt;
  let Icon = CheckCircle;

  if (supportsExpiration && !expirationDate) {
    label = 'تاريخ الانتهاء غير محدد';
    color = colors.warning;
    bg = colors.warningSoft;
    Icon = ClockCountdown;
  }

  if (supportsExpiration && expirationDate) {
    const expiry = new Date(expirationDate);
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    if (expiry < new Date()) {
      label = 'منتهية';
      color = colors.danger;
      bg = colors.dangerSoft;
      Icon = WarningOctagon;
    } else if (expiry <= soon) {
      label = 'ستنتهي قريباً';
      color = colors.warning;
      bg = colors.warningSoft;
      Icon = ClockCountdown;
    } else {
      label = 'صالحة';
      color = colors.success;
      bg = colors.successSoft;
      Icon = CheckCircle;
    }
  }

  return (
    <View style={[styles.badge, { borderRadius: radius.full, backgroundColor: bg, paddingHorizontal: spacing.sm }]}>
      <Icon size={15} color={color} weight="duotone" />
      <AppText variant="caption" color={color} style={styles.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    minHeight: 28,
  },
  text: {
    fontWeight: '600',
  },
});
