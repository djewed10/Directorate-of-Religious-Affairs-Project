import { StyleSheet, View } from 'react-native';
import { AppCard } from './AppCard';
import { AppText } from './AppText';
import { DateBadge } from './DateBadge';
import { IconBadge } from './IconBadge';
import { Mosque as MosqueIcon } from './icons';
import { StorageImage } from './FilePreview';
import { StatusBadge } from './StatusBadge';
import { useTheme } from '@/theme/theme';
import type { Mosque, MosqueListRow } from '@/types/api';
import { money } from '@/utils/format';

export function MosqueCard({
  row,
  mosque,
  associationName,
  onPress,
  onLongPress,
  index = 0,
}: {
  row?: MosqueListRow;
  mosque?: Mosque;
  associationName?: string | null;
  onPress?: () => void;
  onLongPress?: () => void;
  index?: number;
}) {
  const { colors, spacing } = useTheme();
  const item = mosque ?? row?.mosque;
  if (!item) return null;
  const association = associationName ?? row?.associationName;
  const locationLabel = item.addressText;
  return (
    <AppCard onPress={onPress} onLongPress={onLongPress} enteringDelay={index * 45} style={{ gap: spacing.md }}>
      <View style={styles.head}>
        <View style={styles.titleBlock}>
          <View style={[styles.iconLine, { gap: spacing.sm }]}>
            {item.coverImageStorageKey ? (
              <StorageImage
                storageKey={item.coverImageStorageKey}
                style={styles.coverThumb}
                fallback={<IconBadge icon={MosqueIcon} tone="primary" size={42} iconSize={20} />}
              />
            ) : (
              <IconBadge icon={MosqueIcon} tone="primary" size={42} iconSize={20} />
            )}
            <View style={styles.nameBlock}>
              <AppText variant="subtitle" numberOfLines={1}>
                {item.name}
              </AppText>
              <AppText variant="caption" color={colors.primary}>
                رقم {item.officialCode} - {item.commune}
              </AppText>
              {locationLabel ? (
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {locationLabel}
                </AppText>
              ) : null}
            </View>
          </View>
        </View>
        <StatusBadge status={item.mosqueStatus} />
      </View>
      <View style={styles.metrics}>
        <AppText variant="caption" color={colors.textSecondary}>
          الجمعية: {association ?? 'غير محددة'}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          الاستفادات: {money(item.totalAidAmount)} دج
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          الاستهلاك: {money(item.totalConsumedAmount)} دج
        </AppText>
      </View>
      <DateBadge date={item.lastActivityAt} prefix="آخر تحديث" />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
  },
  iconLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameBlock: {
    flex: 1,
    gap: 3,
  },
  coverThumb: {
    width: 42,
    height: 42,
    borderRadius: 14,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
