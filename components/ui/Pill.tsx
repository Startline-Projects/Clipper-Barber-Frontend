import { Pressable, Text } from 'react-native';
import { useColors } from '@/lib/theme/colors';

interface PillProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}

export default function Pill({ label, active, onPress, color }: PillProps) {
  const colors = useColors();
  const activeBg = color ?? colors.green;

  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: active ? activeBg : colors.bg }}
      className="self-start rounded-full px-3 py-2 active:opacity-70"
    >
      <Text
        style={{ color: active ? '#FFFFFF' : colors.secondary }}
        className="text-[13px] font-semibold tracking-[-0.1px]"
      >
        {label}
      </Text>
    </Pressable>
  );
}
