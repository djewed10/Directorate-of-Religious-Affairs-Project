import { Calendar } from 'lucide-react-native';
import { ThemedInput } from './ThemedInput';

export function DatePickerField({ label, value, onChangeText }: { label: string; value?: string; onChangeText: (text: string) => void }) {
  return (
    <ThemedInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder="yyyy-mm-dd"
      keyboardType="numbers-and-punctuation"
      icon={Calendar}
    />
  );
}

