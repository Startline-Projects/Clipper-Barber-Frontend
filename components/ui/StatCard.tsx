import { Text, View } from 'react-native';
import { useColors } from '@/lib/theme/colors';

interface StatCardProps {
  value: string | number;
  label: string;
  dark?: boolean;
}

export default function StatCard({ value, label, dark }: StatCardProps) {
  const colors = useColors();

  return (
    <View
      style={dark ? { backgroundColor: colors.ink } : undefined}
      className={`flex-1 rounded-lg px-[14px] py-4 ${
        dark ? '' : 'bg-surface border border-separator'
      }`}
    >
      <Text
        style={dark ? { color: colors.quaternary } : undefined}
        className={`text-xs font-bold tracking-[0.6px] uppercase ${
          dark ? '' : 'text-tertiary'
        }`}
      >
        {label}
      </Text>
      <Text
        style={dark ? { color: colors.bg } : undefined}
        className={`text-[30px] font-extrabold tracking-[-1px] mt-[6px] ${
          dark ? '' : 'text-ink'
        }`}
      >
        {value}
      </Text>
    </View>
  );
}
