import { ScrollView, Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useAppTheme } from '@/theme/theme';

export interface FilterChip {
  key: string;
  label: string;
}

export function FilterChips({ chips, value, onChange }: { chips: FilterChip[]; value?: string; onChange: (key: string) => void }) {
  const { colors, radii } = useAppTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chips.map((chip) => {
        const active = chip.key === value;
        return (
          <Pressable
            key={chip.key}
            onPress={() => onChange(chip.key)}
            style={[
              styles.chip,
              {
                borderRadius: radii.sm,
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <AppText variant="caption" color={active ? '#FFFFFF' : colors.text} style={styles.label}>{chip.label}</AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 36,
  },
  label: {
    fontWeight: '800',
  },
});

