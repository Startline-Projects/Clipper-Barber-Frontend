import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Toggle from '@/components/ui/Toggle';
import { useColors } from '@/lib/theme/colors';
import { useProfile } from '@/lib/hooks/useProfile';
import { useToggleInHouseServices } from '@/lib/hooks/useSettings';
import { toast } from '@/lib/stores/toast';
import { getReadableError } from '@/lib/utils/get-readable-error';

export default function InHouseServicesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data: profile, isLoading, refetch } = useProfile();
  const toggle = useToggleInHouseServices();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-5">
          <Header title="In-House Services" onBack={() => router.back()} />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.tertiary} />
        </View>
      </SafeAreaView>
    );
  }

  const enabled = profile.inHouseServices ?? false;

  const handleToggle = () => {
    if (toggle.isPending) return;
    const next = !enabled;
    toggle.mutate(next, {
      onError: (err) => toast.error(getReadableError(err)),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView
        className="flex-1 px-5"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tertiary}
          />
        }
      >
        <Header title="In-House Services" onBack={() => router.back()} />

        <Card elevated>
          <Toggle
            label="In-House Services"
            sub="Allow clients to request services at your location/premises."
            on={enabled}
            onToggle={handleToggle}
          />
          {toggle.isPending && (
            <View className="mt-3 flex-row items-center gap-2">
              <ActivityIndicator size="small" color={colors.tertiary} />
              <Text className="text-sm text-tertiary">Saving…</Text>
            </View>
          )}
        </Card>

        <Text className="text-sm text-tertiary mt-3 px-1 leading-[18px]">
          When enabled, clients can book services to be performed at your shop or
          studio. Turn off if you only travel to clients.
        </Text>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
