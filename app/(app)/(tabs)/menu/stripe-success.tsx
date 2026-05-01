import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@/components/ui/Icon';
import Btn from '@/components/ui/Btn';
import { useColors } from '@/lib/theme/colors';

export default function StripeSuccessScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-[72px] h-[72px] rounded-full bg-green/10 items-center justify-center mb-5">
          <Icon name="check" size={36} color={colors.green} />
        </View>
        <Text className="text-[22px] font-extrabold text-ink tracking-[-0.5px] mb-2 text-center">
          Stripe connected!
        </Text>
        <Text className="text-[14px] text-secondary text-center leading-[20px] mb-8 px-4">
          Your account is set up. You can now charge no-show fees and receive
          payouts directly to your bank account.
        </Text>
        <Btn
          label="Go to Payments"
          full
          onPress={() =>
            router.replace('/(app)/(tabs)/menu/payments')
          }
        />
        <View className="mt-2 w-full">
          <Btn
            label="Back to Menu"
            variant="ghost"
            full
            onPress={() => router.replace('/(app)/(tabs)/menu')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
