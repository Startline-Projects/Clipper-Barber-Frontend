import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import StatusBadge from '@/components/ui/StatusBadge';
import TypeBadge from '@/components/ui/TypeBadge';

interface BookingCardProps {
  clientName: string;
  serviceName: string;
  time: string;
  price: number;
  bookingType: string;
  status: string;
  isRecurring?: boolean;
  onPress?: () => void;
}

export default memo(function BookingCard({
  clientName,
  serviceName,
  time,
  price,
  bookingType,
  status,
  isRecurring,
  onPress,
}: BookingCardProps) {
  return (
    <Card elevated onPress={onPress}>
      <View className="flex-row items-center gap-3">
        <Avatar name={clientName} size={42} />

        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-[5px]">
            {isRecurring && <Icon name="loop" size={12} color="#0A84FF" />}
            <Text
              className="text-lg font-semibold text-ink tracking-[-0.2px]"
              numberOfLines={1}
            >
              {clientName}
            </Text>
          </View>
          <Text
            className="text-base text-secondary tracking-[-0.1px] mt-[2px]"
            numberOfLines={1}
          >
            {serviceName} · {time}
          </Text>
          <View className="flex-row gap-1 mt-[5px]">
            <TypeBadge type={bookingType} />
            <StatusBadge status={status} />
          </View>
        </View>

        <Text className="text-xl font-bold text-ink tracking-[-0.3px]">
          ${price}
        </Text>
      </View>
    </Card>
  );
});
