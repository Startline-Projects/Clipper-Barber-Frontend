import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/lib/theme/colors';
import Icon from './Icon';
import type { IconName } from './Icon';

interface SetupAlertsProps {
  stripeConnected?: boolean;
  locationSet?: boolean;
  className?: string;
}

interface AlertRowProps {
  icon: IconName;
  title: string;
  sub: string;
  onPress: () => void;
}

function AlertRow({ icon, title, sub, onPress }: AlertRowProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-md border-[1.5px] border-orange/30 bg-orange/[0.08] px-4 py-[14px]"
    >
      <View className="w-[34px] h-[34px] rounded-full bg-orange/15 items-center justify-center">
        <Icon name={icon} size={18} color={colors.orange} />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-semibold text-ink tracking-[-0.2px]">{title}</Text>
        <Text className="text-base text-orange mt-[1px] tracking-[-0.1px]">{sub}</Text>
      </View>
      <Icon name="chevron" size={16} color={colors.orange} />
    </Pressable>
  );
}

export default function SetupAlerts({
  stripeConnected,
  locationSet,
  className,
}: SetupAlertsProps) {
  const router = useRouter();
  const showStripe = stripeConnected === false;
  const showLocation = locationSet === false;

  if (!showStripe && !showLocation) return null;

  return (
    <View className={`gap-2 ${className ?? ''}`}>
      {showStripe && (
        <AlertRow
          icon="card"
          title="Set up Stripe"
          sub="Connect your account to accept payments"
          onPress={() => router.push('/(app)/(tabs)/menu/stripe-setup')}
        />
      )}
      {showLocation && (
        <AlertRow
          icon="map"
          title="Add your shop location"
          sub="Pin your shop on the map so clients can find you"
          onPress={() => router.push('/(app)/(tabs)/menu/profile')}
        />
      )}
    </View>
  );
}
