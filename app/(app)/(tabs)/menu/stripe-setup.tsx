import { Linking, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import { useOnboardConnect } from '@/lib/hooks/useStripe';

const STEPS = [
  {
    icon: 'user' as const,
    title: 'Verify your identity',
    sub: 'Stripe requires identity verification to process payments securely.',
  },
  {
    icon: 'card' as const,
    title: 'Add bank account',
    sub: 'Connect a bank account to receive payouts from no-show charges.',
  },
  {
    icon: 'shield' as const,
    title: 'Review terms',
    sub: "Accept Stripe's Connected Account agreement.",
  },
  {
    icon: 'check' as const,
    title: 'Start accepting payments',
    sub: 'Once verified, you can charge no-show fees automatically.',
  },
];

export default function StripeSetupScreen() {
  const router = useRouter();
  const colors = useColors();
  const onboard = useOnboardConnect();

  const handleStart = () => {
    if (onboard.isPending) return;
    onboard.mutate(undefined, {
      onSuccess: (url) => Linking.openURL(url),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1 px-5">
        <Header title="Set Up Stripe" onBack={() => router.back()} />

        <View className="items-center mb-lg">
          <View className="w-20 h-20 rounded-full bg-blue/10 items-center justify-center mb-4">
            <Icon name="card" size={34} color={colors.blue} />
          </View>
          <Text className="text-2xl font-extrabold text-ink tracking-[-0.4px] mb-2 text-center">
            Connect your Stripe account
          </Text>
          <Text className="text-md text-tertiary text-center leading-[20px] px-4">
            Stripe handles payment processing so you can charge no-show fees
            and receive payouts securely.
          </Text>
        </View>

        <Card elevated>
          {STEPS.map((step, i) => (
            <View key={i}>
              {i > 0 && <View className="h-px bg-separator my-1" />}
              <View className="flex-row gap-3 py-[12px]">
                <View className="w-[34px] h-[34px] rounded-full bg-blue/10 items-center justify-center mt-[2px]">
                  <Text className="text-md font-bold text-blue">{i + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-ink tracking-[-0.2px]">
                    {step.title}
                  </Text>
                  <Text className="text-base text-tertiary mt-[2px] leading-[18px]">
                    {step.sub}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>

        <View className="mt-lg">
          <Btn
            label={onboard.isPending ? 'Opening Stripe...' : 'Get Started'}
            full
            onPress={handleStart}
            disabled={onboard.isPending}
          />
        </View>
        <View className="mt-2 mb-8">
          <Btn label="I'll do this later" variant="ghost" full onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
