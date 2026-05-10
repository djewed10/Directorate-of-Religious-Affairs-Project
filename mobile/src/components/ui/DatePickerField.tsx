import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { CalendarBlank } from './icons';
import { ThemedButton } from './ThemedButton';
import { ThemedInput } from './ThemedInput';
import { useTheme } from '@/theme/theme';
import { dateAr } from '@/utils/format';

export function DatePickerField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value?: string;
  onChangeText: (text: string) => void;
}) {
  const { colors, radius, spacing, typography } = useTheme();
  const [open, setOpen] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" color={colors.textSecondary}>
          {label}
        </AppText>
        {React.createElement('input', {
          type: 'date',
          value: value ?? '',
          onChange: (event: { target: { value: string } }) => onChangeText(event.target.value),
          style: {
            minHeight: 52,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: colors.border,
            backgroundColor: colors.card,
            color: colors.textPrimary,
            paddingInline: spacing.md,
            fontFamily: typography.families.regular,
            fontSize: 15,
            textAlign: 'right',
            direction: 'rtl',
          },
        })}
      </View>
    );
  }

  return (
    <View>
      <Pressable onPress={() => setOpen(true)}>
        <ThemedInput
          label={label}
          value={value ? dateAr(value) : ''}
          placeholder="اختر التاريخ"
          editable={false}
          icon={CalendarBlank}
          onIconPress={() => setOpen(true)}
        />
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)} snapPoints={['58%', '86%']}>
        <CalendarSheet
          value={value}
          onSelect={(next) => {
            onChangeText(next);
            setOpen(false);
          }}
        />
      </BottomSheet>
    </View>
  );
}

function CalendarSheet({ value, onSelect }: { value?: string; onSelect: (value: string) => void }) {
  const { colors, radius, spacing } = useTheme();
  const initial = parseDate(value) ?? new Date();
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const selectedIso = value?.slice(0, 10);
  const days = useMemo(() => buildMonth(cursor), [cursor]);
  const monthLabel = cursor.toLocaleDateString('ar-DZ', { month: 'long', year: 'numeric' });

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={styles.calendarHead}>
        <ThemedButton
          title="السابق"
          tone="neutral"
          onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        />
        <AppText variant="subtitle">{monthLabel}</AppText>
        <ThemedButton
          title="التالي"
          tone="neutral"
          onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        />
      </View>
      <View style={styles.week}>
        {['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'].map((day) => (
          <AppText key={day} variant="caption" color={colors.textMuted} style={styles.weekDay}>
            {day}
          </AppText>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((day, index) => {
          if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
          const iso = toIsoDate(day);
          const selected = selectedIso === iso;
          return (
            <Pressable
              key={iso}
              onPress={() => onSelect(iso)}
              style={[
                styles.dayCell,
                {
                  backgroundColor: selected ? colors.primary : colors.cardAlt,
                  borderRadius: radius.md,
                },
              ]}
            >
              <AppText color={selected ? colors.onPrimary : colors.textPrimary}>{day.getDate().toLocaleString('ar-DZ')}</AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function buildMonth(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = first.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  calendarHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  week: {
    flexDirection: 'row',
    gap: 6,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayCell: {
    width: '13.45%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
