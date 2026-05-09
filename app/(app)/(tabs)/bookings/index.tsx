import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import TabBar from '@/components/ui/TabBar';
import Pill from '@/components/ui/Pill';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import TypeBadge from '@/components/ui/TypeBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import Icon from '@/components/ui/Icon';
import Btn from '@/components/ui/Btn';
import PauseRecurringDrawer from '@/components/ui/PauseRecurringDrawer';
import { useColors } from '@/lib/theme/colors';
import { useBookings, useNoShowBooking } from '@/lib/hooks/useBookings';
import {
  useRecurringBookings,
  usePauseRecurring,
  useCancelRecurring,
} from '@/lib/hooks/useRecurring';
import { toast } from '@/lib/stores/toast';
import type { BookingListItem } from '@/lib/api/bookings';
import type { RecurringListItem } from '@/lib/api/recurring';
import type { ErrorBoundaryProps } from 'expo-router';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-6 bg-bg">
      <Text className="text-[16px] font-semibold text-ink">Something went wrong</Text>
      <Text className="text-md text-secondary text-center">{error.message}</Text>
      <Pressable onPress={retry} className="px-6 py-3 bg-blue rounded-sm">
        <Text className="text-white font-semibold">Try again</Text>
      </Pressable>
    </View>
  );
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TYPE_FILTER_MAP: Record<string, string> = {
  Regular: 'regular',
  'After-Hours': 'after_hours',
  'Day-Off': 'day_off',
};
const RECURRING_STATUS_MAP: Record<string, string> = {
  Active: 'active',
  Pending: 'pending_barber_approval',
  Paused: 'paused',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function BookingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [tab, setTab] = useState('Upcoming');
  const [typeFilter, setTypeFilter] = useState('All');
  const [recurringSub, setRecurringSub] = useState('Active');
  const [noShowId, setNoShowId] = useState<string | null>(null);
  const noShowMut = useNoShowBooking();

  const timeframe = tab === 'Past' ? 'past' : 'upcoming';
  const bookingsQuery = useBookings({
    timeframe: tab === 'Recurring' ? 'upcoming' : timeframe,
  });

  const recurringStatus =
    RECURRING_STATUS_MAP[recurringSub] as 'active' | 'pending_barber_approval' | 'paused';
  const recurringQuery = useRecurringBookings({ status: recurringStatus });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (tab === 'Recurring') {
      await recurringQuery.refetch();
    } else {
      await bookingsQuery.refetch();
    }
    setRefreshing(false);
  }, [tab, bookingsQuery, recurringQuery]);

  const allBookings = useMemo(
    () => bookingsQuery.data?.pages.flatMap((p) => p.bookings) ?? [],
    [bookingsQuery.data],
  );

  const filteredBookings = useMemo(() => {
    let list = allBookings;
    if (tab === 'Upcoming')
      list = list.filter((b) => b.status !== 'cancelled');
    if (typeFilter !== 'All') {
      const mapped = TYPE_FILTER_MAP[typeFilter];
      if (mapped) list = list.filter((b) => b.bookingType === mapped);
    }
    return list;
  }, [allBookings, tab, typeFilter]);

  const recurringList = useMemo(
    () =>
      recurringQuery.data?.pages.flatMap((p) => p.recurringBookings) ?? [],
    [recurringQuery.data],
  );

  const confirmNoShow = () => {
    if (!noShowId) return;
    noShowMut.mutate(noShowId, {
      onSuccess: () => {
        setNoShowId(null);
        toast.success('No-show recorded');
      },
    });
  };

  const noShowBooking = noShowId
    ? allBookings.find((b) => b.id === noShowId)
    : null;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="px-5">
        <Header title="Bookings" />
        <TabBar
          tabs={['Upcoming', 'Past', 'Recurring']}
          active={tab}
          onChange={(t) => {
            setTab(t);
            setTypeFilter('All');
          }}
        />
      </View>

      {tab !== 'Recurring' ? (
        <>
          <View className="flex-row gap-[6px] px-5 mb-4">
            {['All', 'Regular', 'After-Hours', 'Day-Off'].map((f) => (
              <Pill
                key={f}
                label={f}
                active={typeFilter === f}
                onPress={() => setTypeFilter(f)}
              />
            ))}
          </View>

          <FlatList
            data={filteredBookings}
            keyExtractor={(b) => b.id}
            contentContainerClassName="px-5"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tertiary} />}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
            updateCellsBatchingPeriod={50}
            onEndReached={() => {
              if (bookingsQuery.hasNextPage && !bookingsQuery.isFetchingNextPage)
                bookingsQuery.fetchNextPage();
            }}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              !bookingsQuery.isLoading ? (
                <View className="items-center py-12">
                  <Text className="text-lg text-tertiary font-medium">
                    No {tab.toLowerCase()} bookings
                  </Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              bookingsQuery.isFetchingNextPage ? (
                <ActivityIndicator className="py-4" color={colors.tertiary} />
              ) : null
            }
            renderItem={({ item: b }) => (
              <BookingCard
                booking={b}
                isPast={tab === 'Past'}
                onPress={() =>
                  router.push(`/(app)/(tabs)/bookings/${b.id}`)
                }
                onNoShow={() => setNoShowId(b.id)}
              />
            )}
          />
        </>
      ) : (
        <RecurringTab
          sub={recurringSub}
          onSubChange={setRecurringSub}
          items={recurringList}
          isLoading={recurringQuery.isLoading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          isFetchingNextPage={recurringQuery.isFetchingNextPage}
          onEndReached={() => {
            if (recurringQuery.hasNextPage && !recurringQuery.isFetchingNextPage)
              recurringQuery.fetchNextPage();
          }}
          onPress={(id) =>
            router.push(`/(app)/(tabs)/bookings/recurring/${id}`)
          }
        />
      )}

      <NoShowSheet
        visible={!!noShowId}
        booking={noShowBooking}
        onClose={() => setNoShowId(null)}
        onConfirm={confirmNoShow}
        isPending={noShowMut.isPending}
      />
    </SafeAreaView>
  );
}

function BookingCard({
  booking: b,
  isPast,
  onPress,
  onNoShow,
}: {
  booking: BookingListItem;
  isPast: boolean;
  onPress: () => void;
  onNoShow: () => void;
}) {
  const colors = useColors();

  return (
    <Card elevated onPress={onPress}>
      <View className="flex-row items-center gap-3">
        <Avatar name={b.client.name} size={42} />
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-[5px]">
            {b.isRecurring && (
              <Icon name="loop" size={12} color={colors.blue} />
            )}
            <Text className="text-lg font-semibold text-ink tracking-[-0.2px]">
              {b.client.name}
            </Text>
          </View>
          <Text className="text-base text-secondary tracking-[-0.1px] mt-[2px]">
            {b.service.name} · {formatTime(b.scheduledAt)}
          </Text>
          <View className="flex-row gap-1 mt-[5px]">
            <TypeBadge type={b.bookingType} />
            <StatusBadge status={b.status} />
          </View>
        </View>
        <Text className="text-xl font-bold text-ink tracking-[-0.3px]">
          ${b.totalPrice}
        </Text>
      </View>

      {isPast && b.status === 'completed' && (
        <Pressable
          onPress={() => onNoShow()}
          className="mt-3 py-[10px] rounded-sm border-[1.5px] border-red/25 bg-red/[0.06] items-center"
        >
          <Text className="text-base font-semibold text-red">
            Mark No-Show
          </Text>
        </Pressable>
      )}

      {isPast && b.status === 'no_show' && (
        <View className="flex-row items-center gap-2 mt-[10px] px-3 py-2 rounded-sm bg-green/10">
          <Icon name="check" size={14} color={colors.green} />
          <Text className="text-sm font-semibold text-green">
            No-show fee charged
          </Text>
        </View>
      )}
    </Card>
  );
}

function RecurringTab({
  sub,
  onSubChange,
  items,
  isLoading,
  refreshing,
  onRefresh,
  isFetchingNextPage,
  onEndReached,
  onPress,
}: {
  sub: string;
  onSubChange: (s: string) => void;
  items: RecurringListItem[];
  isLoading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  isFetchingNextPage: boolean;
  onEndReached: () => void;
  onPress: (id: string) => void;
}) {
  const colors = useColors();
  const pauseMut = usePauseRecurring();
  const cancelMut = useCancelRecurring();
  const [pausingId, setPausingId] = useState<string | null>(null);
  const pausingItem = pausingId
    ? items.find((r) => r.id === pausingId)
    : null;

  return (
    <>
      <View className="flex-row gap-[6px] px-5 mb-4">
        {['Active', 'Pending', 'Paused'].map((t) => (
          <Pill
            key={t}
            label={t}
            active={sub === t}
            onPress={() => onSubChange(t)}
          />
        ))}
      </View>

      {isLoading ? (
        <View className="items-center py-12">
          <ActivityIndicator color={colors.tertiary} />
        </View>
      ) : items.length === 0 ? (
        <View className="items-center py-12">
          <Text className="text-lg text-tertiary font-medium">
            No {sub.toLowerCase()} arrangements
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          contentContainerClassName="px-5"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tertiary} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator className="py-4" color={colors.tertiary} />
            ) : null
          }
          renderItem={({ item: r }) => (
            <Card elevated onPress={() => onPress(r.id)}>
              <View className="flex-row items-center gap-3">
                <Avatar name={r.client.name} size={42} />
                <View className="flex-1">
                  <View className="flex-row items-center gap-[5px]">
                    <Icon name="loop" size={12} color={colors.blue} />
                    <Text className="text-lg font-semibold text-ink tracking-[-0.2px]">
                      {r.client.name}
                    </Text>
                  </View>
                  <Text className="text-base text-secondary mt-[2px]">
                    {DAY_NAMES[r.dayOfWeek]} · {r.slotTime} · {r.frequency}
                  </Text>
                  <Text className="text-sm text-tertiary mt-[1px]">
                    {r.service.name}
                    {r.nextOccurrenceAt
                      ? ` · Next: ${formatDate(r.nextOccurrenceAt)}`
                      : ''}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xl font-bold text-ink tracking-[-0.3px]">
                    ${r.priceUsd}
                  </Text>
                  <Text className="text-xs text-tertiary">/visit</Text>
                </View>
              </View>

              {r.status === 'active' && (
                <View className="flex-row gap-2 mt-[14px] pt-[14px] border-t border-separator">
                  <View className="flex-1">
                    <Btn
                      label="Pause"
                      variant="ghost"
                      full
                      onPress={() => setPausingId(r.id)}
                    />
                  </View>
                  <View className="flex-1">
                    <Btn
                      label="Cancel"
                      variant="danger"
                      full
                      onPress={() =>
                        cancelMut.mutate(r.id, {
                          onSuccess: () => toast.success('Recurring cancelled'),
                        })
                      }
                    />
                  </View>
                </View>
              )}
            </Card>
          )}
        />
      )}

      <PauseRecurringDrawer
        visible={!!pausingId}
        subtitle={
          pausingItem
            ? `${pausingItem.client.name} — ${DAY_NAMES[pausingItem.dayOfWeek]} ${pausingItem.slotTime}`
            : undefined
        }
        onClose={() => setPausingId(null)}
        onConfirm={(body) => {
          if (!pausingId) return;
          pauseMut.mutate(
            { recurringId: pausingId, body },
            {
              onSuccess: () => {
                setPausingId(null);
                toast.success('Recurring paused');
              },
            },
          );
        }}
        isPending={pauseMut.isPending}
      />
    </>
  );
}

function NoShowSheet({
  visible,
  booking,
  onClose,
  onConfirm,
  isPending,
}: {
  visible: boolean;
  booking: BookingListItem | null | undefined;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Pressable className="bg-surface rounded-t-3xl px-5 pt-5 pb-8" onPress={() => {}}>
          <View className="w-10 h-1 rounded-full bg-separator-opaque self-center mb-[18px]" />
          <View className="w-14 h-14 rounded-full bg-red/10 items-center justify-center self-center mb-[14px]">
            <Icon name="alert" size={28} color={colors.red} />
          </View>
          <Text className="text-3xl font-extrabold text-ink tracking-[-0.5px] text-center">
            Charge no-show fee?
          </Text>
          <Text className="text-md text-secondary text-center leading-[20px] tracking-[-0.1px] mt-2 mb-[18px] px-2">
            {booking?.client.name} will be marked as a no-show and notified.
          </Text>
          <View className="flex-row gap-[10px]">
            <View className="flex-1">
              <Btn label="Cancel" variant="ghost" full onPress={onClose} />
            </View>
            <View className="flex-[2]">
              <Btn
                label={isPending ? 'Charging...' : 'Confirm No-Show'}
                full
                onPress={onConfirm}
                disabled={isPending}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
