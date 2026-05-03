import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Toggle from '@/components/ui/Toggle';
import Divider from '@/components/ui/Divider';
import { useColors } from '@/lib/theme/colors';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/lib/hooks/useNotificationSettings';
import { toast } from '@/lib/stores/toast';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data, isLoading } = useNotificationSettings();
  const update = useUpdateNotificationSettings();

  if (isLoading || !data) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-5">
          <Header title="Notifications" onBack={() => router.back()} />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.tertiary} />
        </View>
      </SafeAreaView>
    );
  }

  const toggle = (key: 'normal_bookings' | 'recurring_bookings') => {
    update.mutate(
      { ...data, [key]: !data[key] },
      { onSuccess: () => toast.success('Notification settings updated') },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1 px-5">
        <Header title="Notifications" onBack={() => router.back()} />

        <Card elevated>
          <Toggle
            label="Normal bookings"
            sub="New booking requests and confirmations"
            on={data.normal_bookings}
            onToggle={() => toggle('normal_bookings')}
          />
          <Divider />
          <Toggle
            label="Recurring bookings"
            sub="Recurring arrangement requests and updates"
            on={data.recurring_bookings}
            onToggle={() => toggle('recurring_bookings')}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
