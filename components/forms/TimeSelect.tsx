import { Pressable, Text, View } from 'react-native';
import { vars } from 'nativewind';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';

interface TimeSelectProps {
  value?: string;
  onPress: () => void;
  label: string;
  color?: string;
  placeholder?: string;
}

export default function TimeSelect({
  value,
  onPress,
  label,
  color,
  placeholder = '—',
}: TimeSelectProps) {
  const colors = useColors();
  const accent = color ?? colors.tertiary;

  return (
    <View className="w-full">
      <Text
        style={vars({ '--ts-label': accent })}
        className="text-[12px] font-semibold text-[--ts-label] tracking-[0.2px] uppercase mb-[6px]"
      >
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        style={color ? vars({
          '--ts-border': color + '30',
          '--ts-bg': color + '06',
        }) : undefined}
        className={`w-full flex-row items-center justify-between px-[10px] py-3 rounded-sm ${
          color
            ? 'border-[1.5px] border-[--ts-border] bg-[--ts-bg]'
            : 'border-[1.5px] border-separator-opaque bg-surface'
        } active:opacity-70`}
      >
        <Text className="text-[14px] font-semibold text-ink">
          {value ? formatTime12(value) : placeholder}
        </Text>
        <Icon name="chevron" size={16} color={colors.tertiary} />
      </Pressable>
    </View>
  );
}

export function generateTimeSlots(
  startHour = 6,
  endHour = 23,
  stepMinutes = 30,
): string[] {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      if (h === endHour && m > 30) break;
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
}

export function formatTime12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const hour12 = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${hour12}:${mStr} ${ampm}`;
}
