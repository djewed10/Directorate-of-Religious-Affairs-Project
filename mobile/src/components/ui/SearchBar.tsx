import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedInput } from './ThemedInput';
import { MagnifyingGlass, X } from './icons';
import { useTheme } from '@/theme/theme';

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'ابحث بالرقم، الاسم، الجمعية أو البلدية',
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <ThemedInput value={value} onChangeText={onChangeText} placeholder={placeholder} icon={MagnifyingGlass} />
      {value ? (
        <Pressable onPress={() => onChangeText('')} style={styles.clearButton}>
          <X size={18} color={colors.textMuted} weight="bold" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  clearButton: {
    position: 'absolute',
    top: 15,
    end: 12,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
