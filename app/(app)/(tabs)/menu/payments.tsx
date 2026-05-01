import { Alert, ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import {
  useConnectStatus,
  useOnboardConnect,
  useDisconnectConnect,
} from '@/lib/hooks/useStripe';

export default function PaymentsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data: status, isLoading } = useConnectStatus();
  const onboard = useOnboardConnect();
  const disconnect = useDisconnectConnect();

  const handleConnect = () => {
    if (onboard.isPending) return;
    onboard.mutate(undefined, {
      onSuccess: (url) => Linking.openURL(url),
    });
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Stripe?',
      "You won't be able to charge no-show fees or receive payouts until you reconnect.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => disconnect.mutate(undefined),
        },
      ],
    );
  };

  if (isLoading || !status) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-5">
          <Header title="Payments & Payouts" onBack={() => router.back()} />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.tertiary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1 px-5">
        <Header title="Payments & Payouts" onBack={() => router.back()} />

        {!status.connected ? (
          <>
            {/* Not connected */}
            <Card elevated className="items-center py-8">
              <View className="w-16 h-16 rounded-full bg-orange/12 items-center justify-center mb-4">
                <Icon name="card" size={28} color={colors.orange} />
              </View>
              <Text className="text-[18px] font-bold text-ink tracking-[-0.3px] mb-2">
                Set up Stripe
              </Text>
              <Text className="text-[14px] text-tertiary text-center leading-[20px] mb-6 px-4">
                Connect your Stripe account to charge no-show fees and receive payouts.
              </Text>
              <Btn
                label={onboard.isPending ? 'Opening...' : 'Connect Stripe'}
                full
                onPress={handleConnect}
                disabled={onboard.isPending}
              />
            </Card>
          </>
        ) : (
          <>
            {/* Connected status */}
            <Card elevated>
              <View className="flex-row items-center gap-3 mb-4">
                <View className="w-12 h-12 rounded-full bg-green/12 items-center justify-center">
                  <Icon name="check" size={22} color={colors.green} />
                </View>
                <View className="flex-1">
                  <Text className="text-[17px] font-bold text-ink tracking-[-0.3px]">
                    Stripe Connected
                  </Text>
                  <Text className="text-[13px] text-tertiary mt-[2px]">
                    Your account is active
                  </Text>
                </View>
              </View>

              <StatusRow
                label="Charges"
                enabled={status.chargesEnabled}
                colors={colors}
              />
              <StatusRow
                label="Payouts"
                enabled={status.payoutsEnabled}
                colors={colors}
              />

              {status.requirementsCurrentlyDue.length > 0 && (
                <View className="mt-3 p-3 rounded-md bg-orange/8 border border-orange/20">
                  <Text className="text-[13px] font-semibold text-orange mb-1">
                    Action Required
                  </Text>
                  <Text className="text-[12px] text-secondary leading-[17px]">
                    Stripe needs additional information. Tap below to complete setup.
                  </Text>
                  <Pressable onPress={handleConnect} className="mt-2">
                    <Text className="text-[13px] font-semibold text-blue">
                      Complete requirements →
                    </Text>
                  </Pressable>
                </View>
              )}
            </Card>

            {/* Actions */}
            <Card elevated>
              <Pressable
                onPress={handleConnect}
                className="flex-row items-center gap-3 py-[12px]"
              >
                <Icon name="link" size={18} color={colors.secondary} />
                <Text className="text-[15px] font-semibold text-ink tracking-[-0.2px]">
                  Open Stripe Dashboard
                </Text>
              </Pressable>

              <View className="h-px bg-separator" />

              <Pressable
                onPress={handleDisconnect}
                className="flex-row items-center gap-3 py-[12px]"
              >
                <Icon name="trash" size={18} color={colors.red} />
                <Text className="text-[15px] font-semibold text-red tracking-[-0.2px]">
                  Disconnect Stripe
                </Text>
              </Pressable>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusRow({
  label,
  enabled,
  colors,
}: {
  label: string;
  enabled: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View className="flex-row items-center justify-between py-[10px]">
      <Text className="text-[14px] text-secondary">{label}</Text>
      <View className="flex-row items-center gap-[6px]">
        <View
          className={`w-[8px] h-[8px] rounded-full ${
            enabled ? 'bg-green' : 'bg-orange'
          }`}
        />
        <Text
          className={`text-[13px] font-semibold ${
            enabled ? 'text-green' : 'text-orange'
          }`}
        >
          {enabled ? 'Active' : 'Pending'}
        </Text>
      </View>
    </View>
  );
}
