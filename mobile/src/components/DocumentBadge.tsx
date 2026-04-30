import { FileCheck, FileClock, FileWarning } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { useAppTheme } from '@/theme/theme';

export function DocumentBadge({ supportsExpiration, expirationDate }: { supportsExpiration: boolean; expirationDate?: string | null }) {
  const { colors, radii } = useAppTheme();
  let label = 'بدون صلاحية';
  let tone = colors.info;
  let Icon = FileCheck;
  if (supportsExpiration && !expirationDate) {
    label = 'لم يحدد تاريخ انتهاء';
    tone = colors.warning;
    Icon = FileClock;
  }
  if (supportsExpiration && expirationDate) {
    const expiry = new Date(expirationDate);
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    if (expiry < new Date()) {
      label = 'منتهية';
      tone = colors.danger;
      Icon = FileWarning;
    } else if (expiry <= soon) {
      label = 'ستنتهي قريبًا';
      tone = colors.warning;
      Icon = FileClock;
    } else {
      label = 'صالحة';
      tone = colors.success;
      Icon = FileCheck;
    }
  }
  return (
    <View style={[styles.badge, { borderRadius: radii.sm, backgroundColor: `${tone}20` }]}>
      <Icon size={14} color={tone} />
      <AppText variant="caption" color={tone} style={styles.text}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  text: {
    fontWeight: '800',
  },
});

