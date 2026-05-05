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
        style={{ color: active ? colors.bg : colors.secondary }}
        className="text-base font-semibold tracking-[-0.1px]"
      >
        {label}
      </Text>
    </Pressable>
  );
}
