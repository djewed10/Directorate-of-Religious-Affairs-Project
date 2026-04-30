import { Search } from 'lucide-react-native';
import { ThemedInput } from './ThemedInput';

export function SearchBar({ value, onChangeText, placeholder = 'ابحث بالرقم، الاسم، الجمعية أو البلدية' }: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  return <ThemedInput value={value} onChangeText={onChangeText} placeholder={placeholder} icon={Search} />;
}

