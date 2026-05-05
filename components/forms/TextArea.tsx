import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface TextAreaProps extends Omit<TextInputProps, 'className' | 'multiline'> {
  label: string;
}

export default function TextArea({ label, ...inputProps }: TextAreaProps) {
  return (
    <View className="w-full">
      <Text className="text-sm font-bold text-tertiary mb-[6px] tracking-[0.3px] uppercase">
        {label}
      </Text>
      <TextInput
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        placeholderTextColor={undefined}
        {...inputProps}
        className="w-full px-[14px] py-[13px] rounded-md border-[1.5px] border-separator-opaque bg-surface text-lg font-medium text-ink tracking-[-0.2px] focus:border-ink placeholder:text-tertiary min-h-[90px]"
      />
    </View>
  );
}
