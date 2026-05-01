import { View, Text } from 'react-native';
import { vars } from 'nativewind';

export interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
  small?: boolean;
}

export default function Badge({
  label,
  color = '#FFF',
  bg = 'transparent',
  small,
}: BadgeProps) {
  return (
    <View
      style={vars({ '--badge-bg': bg })}
      className={`flex-row items-center self-start rounded-full ${
        small ? 'px-[6px] py-[1px]' : 'px-2 py-[2.5px]'
      } bg-[--badge-bg]`}
    >
      <Text
        style={vars({ '--badge-color': color })}
        className={`text-[--badge-color] font-bold uppercase tracking-[0.4px] ${
          small
            ? 'text-[9px] leading-[13px]'
            : 'text-[10px] leading-[14px]'
        }`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
