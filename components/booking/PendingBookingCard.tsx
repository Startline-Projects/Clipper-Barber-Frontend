import { Pressable, Text, View } from 'react-native';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import TypeBadge from '@/components/ui/TypeBadge';
import { useColors } from '@/lib/theme/colors';

interface PendingBookingCardProps {
  clientName: string;
  serviceName: string;
  time: string;
  price: number;
  bookingType: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function PendingBookingCard({
  clientName,
  serviceName,
  time,
  price,
  bookingType,
  onAccept,
  onDecline,
}: PendingBookingCardProps) {
  const colors = useColors();

  return (
    <Card elevated>
      <View className="flex-row items-center gap-3 mb-[14px]">
        <Avatar name={clientName} size={40} />

        <View className="flex-1">
          <Text className="text-lg font-semibold text-ink tracking-[-0.2px]">
            {clientName}
          </Text>
          <View className="flex-row items-center gap-[6px] mt-[3px]">
            <Text className="text-base text-secondary">
              {serviceName} · {time}
            </Text>
            <TypeBadge type={bookingType} />
          </View>
        </View>

        <Text className="text-xl font-bold text-ink tracking-[-0.3px]">
          ${price}
        </Text>
      </View>

      <View className="flex-row gap-2">
        <Pressable
          onPress={onAccept}
          className="flex-1 flex-row items-center justify-center gap-[6px] py-[11px] rounded-sm bg-ink active:opacity-70"
        >
          <Icon name="check" size={16} color="#FFF" />
          <Text className="text-white text-md font-semibold">Accept</Text>
        </Pressable>

        <Pressable
          onPress={onDecline}
          className="flex-1 flex-row items-center justify-center gap-[6px] py-[11px] rounded-sm border-[1.5px] border-red/[0.19] bg-red/[0.024] active:opacity-70"
        >
          <Icon name="x" size={14} color={colors.red} />
          <Text className="text-red text-md font-semibold">Decline</Text>
        </Pressable>
      </View>
    </Card>
  );
}
