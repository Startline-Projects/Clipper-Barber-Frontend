import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { vars } from 'nativewind';
import Icon from '@/components/ui/Icon';
import TypeBadge from '@/components/ui/TypeBadge';
import { useColors } from '@/lib/theme/colors';

interface ScheduleSlotProps {
  clientName: string;
  serviceName: string;
  time: string;
  price: number;
  bookingType: string;
  isRecurring?: boolean;
  isLast?: boolean;
  onPress?: () => void;
}

const barColor: Record<string, string> = {
  after_hours: '#FF9F0A',
  day_off: '#BF5AF2',
};

export default memo(function ScheduleSlot({
  clientName,
  serviceName,
  time,
  price,
  bookingType,
  isRecurring,
  isLast,
  onPress,
}: ScheduleSlotProps) {
  const colors = useColors();
  const accent = barColor[bookingType] ?? colors.green;
  const [timeValue, timePeriod] = time.split(' ');

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-[14px] px-4 py-[14px] active:opacity-70 ${
        isLast ? '' : 'border-b-[0.5px] border-separator'
      }`}
    >
      <View className="items-center min-w-[44px]">
        <Text className="text-xl font-bold text-ink tracking-[-0.3px]">
          {timeValue}
        </Text>
        <Text className="text-xs font-semibold text-tertiary">
          {timePeriod}
        </Text>
      </View>

      <View
        style={vars({ '--bar-color': accent })}
        className="w-[3px] h-[36px] rounded-[2px] bg-[--bar-color]"
      />

      <View className="flex-1">
        <View className="flex-row items-center gap-[5px]">
          {isRecurring && <Icon name="loop" size={13} color={colors.blue} />}
          <Text
            className="text-lg font-semibold text-ink tracking-[-0.2px]"
            numberOfLines={1}
          >
            {clientName}
          </Text>
        </View>
        <View className="flex-row items-center gap-[5px] mt-[2px]">
          <Text className="text-base text-secondary">{serviceName}</Text>
          <TypeBadge type={bookingType} />
        </View>
      </View>

      <Text className="text-xl font-bold text-ink tracking-[-0.3px]">
        ${price}
      </Text>
    </Pressable>
  );
});
