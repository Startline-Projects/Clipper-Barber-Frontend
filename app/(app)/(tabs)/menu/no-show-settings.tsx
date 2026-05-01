import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Toggle from '@/components/ui/Toggle';
import Btn from '@/components/ui/Btn';
import TextField from '@/components/forms/TextField';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import { useProfile } from '@/lib/hooks/useProfile';
import { useUpdateNoShowCharge } from '@/lib/hooks/useSettings';

export default function NoShowSettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data: profile, isLoading } = useProfile();
  const update = useUpdateNoShowCharge();

  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [amount, setAmount] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState('');

  if (profile && !hydrated) {
    setEnabled(profile.noShowChargeEnabled ?? false);
    setAmount(profile.noShowChargeAmountUsd?.toString() ?? '');
    setHydrated(true);
  }

  if (isLoading || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-5">
          <Header title="No-Show Charge" onBack={() => router.back()} />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.tertiary} />
        </View>
      </SafeAreaView>
    );
  }

  const isEnabled = enabled ?? false;
  const currentAmount = profile.noShowChargeAmountUsd;
  const dirty =
    isEnabled !== (profile.noShowChargeEnabled ?? false) ||
    (isEnabled && amount !== (currentAmount?.toString() ?? ''));

  const handleSave = () => {
    if (update.isPending) return;
    if (isEnabled) {
      const num = Number(amount);
      if (!amount.trim() || isNaN(num) || num <= 0) {
        setError('Enter a valid amount');
        return;
      }
      update.mutate(
        { enabled: true, amountUsd: num },
        { onSuccess: () => router.back() },
      );
    } else {
      update.mutate(
        { enabled: false },
        { onSuccess: () => router.back() },
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
          <Header title="No-Show Charge" onBack={() => router.back()} />

          <Card elevated>
            <Toggle
              label="Enable No-Show Charge"
              sub="Charge clients who miss their appointment without canceling"
              on={isEnabled}
              onToggle={() => {
                setEnabled(!isEnabled);
                setError('');
              }}
            />
          </Card>

          {isEnabled && (
            <Card elevated>
              <Text className="text-[13px] font-bold text-secondary tracking-[0.3px] uppercase mb-3">
                Charge Amount
              </Text>
              <TextField
                label="Amount (USD)"
                value={amount}
                onChangeText={(t) => {
                  setAmount(t);
                  if (error) setError('');
                }}
                placeholder="$25"
                keyboardType="numeric"
                error={error}
              />
              <View className="mt-4 p-3 rounded-md bg-orange/8 border border-orange/20">
                <View className="flex-row items-center gap-2 mb-1">
                  <Icon name="info" size={14} color={colors.orange} />
                  <Text className="text-[13px] font-semibold text-orange">
                    Requires Stripe
                  </Text>
                </View>
                <Text className="text-[12px] text-secondary leading-[17px]">
                  No-show charges are processed through your connected Stripe account. Make sure Stripe is set up in Payments & Payouts.
                </Text>
              </View>
            </Card>
          )}

          {dirty && (
            <Btn
              label={update.isPending ? 'Saving...' : 'Save Changes'}
              full
              onPress={handleSave}
              disabled={update.isPending}
            />
          )}

          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
