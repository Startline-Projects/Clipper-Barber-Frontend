import { forwardRef, type ReactNode } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface TextFieldProps extends Omit<TextInputProps, 'className'> {
  label: string;
  right?: ReactNode;
  half?: boolean;
  error?: string;
}

const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, right, half, error, ...inputProps },
  ref,
) {
  return (
    <View className={half ? 'flex-1' : 'w-full'}>
      <Text className="text-[13px] font-semibold text-secondary mb-[6px] tracking-[-0.1px]">
        {label}
      </Text>
      <View className="relative">
        <TextInput
          ref={ref}
          placeholderTextColor={undefined}
          {...inputProps}
          className={`w-full px-4 py-[14px] rounded-md border-[1.5px] bg-surface text-[16px] font-medium text-ink tracking-[-0.2px] focus:border-ink placeholder:text-tertiary ${
            error ? 'border-red' : 'border-separator-opaque'
          } ${right ? 'pr-[52px]' : ''}`}
        />
        {right && (
          <View className="absolute right-4 top-0 bottom-0 justify-center">
            {right}
          </View>
        )}
      </View>
      {error && (
        <Text className="text-[12px] text-red mt-[4px] tracking-[-0.1px]">
          {error}
        </Text>
      )}
    </View>
  );
});

export default TextField;
