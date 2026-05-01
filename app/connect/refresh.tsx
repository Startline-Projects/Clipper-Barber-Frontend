import { useEffect } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/lib/theme/colors';
import { useOnboardConnect } from '@/lib/hooks/useStripe';

export default function StripeRefreshScreen() {
  const router = useRouter();
  const colors = useColors();
  const onboard = useOnboardConnect();

  useEffect(() => {
    onboard.mutate(undefined, {
      onSuccess: (url) => {
        Linking.openURL(url);
        router.replace('/(app)/(tabs)/menu/payments');
      },
      onError: () => {
        router.replace('/(app)/(tabs)/menu/payments');
      },
    });
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-bg items-center justify-center">
      <ActivityIndicator color={colors.tertiary} />
    </SafeAreaView>
  );
}
