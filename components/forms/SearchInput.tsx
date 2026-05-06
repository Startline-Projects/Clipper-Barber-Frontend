import { TextInput, View } from 'react-native';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
}: SearchInputProps) {
  const colors = useColors();

  return (
    <View className="relative w-full">
      <View className="absolute left-3 top-0 bottom-0 z-10 justify-center">
        <Icon name="alert" size={18} color={colors.tertiary} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        className="w-full pl-[40px] pr-4 py-3 rounded-sm bg-bg text-lg font-medium text-ink tracking-[-0.2px] placeholder:text-tertiary"
      />
    </View>
  );
}
