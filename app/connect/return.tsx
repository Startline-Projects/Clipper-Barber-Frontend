import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/lib/theme/colors';
import { useConnectStatus } from '@/lib/hooks/useStripe';

export default function StripeReturnScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data: status, isLoading } = useConnectStatus();

  useEffect(() => {
    if (isLoading || !status) return;

    if (status.connected && status.chargesEnabled) {
      router.replace('/(app)/(tabs)/menu/stripe-success');
    } else {
      router.replace('/(app)/(tabs)/menu/payments');
    }
  }, [status, isLoading]);

  return (
    <SafeAreaView className="flex-1 bg-bg items-center justify-center">
      <ActivityIndicator color={colors.tertiary} />
    </SafeAreaView>
  );
}
