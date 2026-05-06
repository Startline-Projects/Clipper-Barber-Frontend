import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import {
  useNotifications,
  useMarkNotificationRead,
} from '@/lib/hooks/useNotifications';
import type { Notification } from '@/lib/api/notifications';

const TYPE_COLORS: Record<string, string> = {
  new_booking: '#0A84FF',
  cancelled_booking: '#FF453A',
  new_recurring_request: '#BF5AF2',
  recurring_cancelled: '#FF453A',
  recurring_paused: '#FF9F0A',
  new_message: '#0A84FF',
  booking_confirmed: '#30D158',
  booking_cancelled: '#FF453A',
  recurring_accepted: '#30D158',
  recurring_refused: '#FF453A',
  recurring_expiring: '#FF9F0A',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const markRead = useMarkNotificationRead();

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } =
    useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const notifications = useMemo(
    () => data?.pages.flatMap((p) => p.notifications) ?? [],
    [data],
  );

  const handlePress = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.id);

    if (n.recurringBookingId) {
      router.push(`/(app)/(tabs)/bookings/recurring/${n.recurringBookingId}`);
    } else if (n.bookingId) {
      router.push(`/(app)/(tabs)/today/${n.bookingId}`);
    } else if (n.conversationId) {
      router.push(`/(app)/(tabs)/messages/${n.conversationId}`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="px-5">
        <Header title="Notifications" onBack={() => router.back()} />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.tertiary} />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-5">
          <View className="w-14 h-14 rounded-full bg-bg items-center justify-center mb-4">
            <Icon name="bell" size={24} color={colors.tertiary} />
          </View>
          <Text className="text-lg font-medium text-tertiary">
            All caught up
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerClassName="px-5"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tertiary} />}
          removeClippedSubviews={true}
          initialNumToRender={15}
          maxToRenderPerBatch={8}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator className="py-4" color={colors.tertiary} />
            ) : null
          }
          renderItem={({ item: n }) => {
            const dotColor = TYPE_COLORS[n.type] ?? colors.blue;

            return (
              <Pressable
                onPress={() => handlePress(n)}
                className="flex-row gap-3 py-[14px] border-b border-separator"
              >
                <View
                  style={{ backgroundColor: dotColor + '12' }}
                  className="w-11 h-11 rounded-xl items-center justify-center shrink-0 mt-[1px]"
                >
                  <View
                    style={{ backgroundColor: dotColor }}
                    className="w-2 h-2 rounded-full"
                  />
                </View>

                <View className="flex-1">
                  <View className="flex-row justify-between items-baseline">
                    <Text
                      className={`text-md tracking-[-0.2px] flex-1 ${
                        n.isRead
                          ? 'font-medium text-ink'
                          : 'font-semibold text-ink'
                      }`}
                      numberOfLines={1}
                    >
                      {n.title}
                    </Text>
                    <Text className="text-sm text-quaternary shrink-0 ml-2">
                      {timeAgo(n.createdAt)}
                    </Text>
                  </View>
                  <Text className="text-base text-secondary leading-[18px] tracking-[-0.1px] mt-[3px]">
                    {n.body}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
