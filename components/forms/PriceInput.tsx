import { Text, TextInput, View } from 'react-native';

interface PriceInputProps {
  value: string;
  onChangeText: (text: string) => void;
  suffix?: string;
  variant?: 'default' | 'emphasized';
  placeholder?: string;
}

export default function PriceInput({
  value,
  onChangeText,
  suffix,
  variant = 'default',
  placeholder = '0',
}: PriceInputProps) {
  const isEmphasized = variant === 'emphasized';

  return (
    <View
      className={`flex-row items-center rounded-md ${
        isEmphasized
          ? 'px-4 py-[14px] bg-red/[0.024] border-[1.5px] border-red/[0.12]'
          : 'px-4 py-3 bg-bg'
      }`}
    >
      <Text
        className={`font-bold ${
          isEmphasized
            ? 'text-[38px] font-extrabold text-red tracking-[-1px]'
            : 'text-[24px] text-ink'
        }`}
      >
        $
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder}
        className={`bg-transparent ${
          isEmphasized
            ? 'text-[40px] font-extrabold text-red tracking-[-1.2px] w-[100px]'
            : 'text-[24px] font-bold text-ink tracking-[-0.5px] w-[80px]'
        } placeholder:text-quaternary`}
      />
      {suffix && (
        <Text
          className={`text-[14px] text-tertiary ${
            isEmphasized ? 'font-semibold' : ''
          }`}
        >
          {suffix}
        </Text>
      )}
    </View>
  );
}
