import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Avatar from '@/components/ui/Avatar';
import TypeBadge from '@/components/ui/TypeBadge';
import Icon from '@/components/ui/Icon';
import Divider from '@/components/ui/Divider';
import Toggle from '@/components/ui/Toggle';
import Btn from '@/components/ui/Btn';
import { useColors } from '@/lib/theme/colors';
import { useBookings, useConfirmBooking, useCancelBooking } from '@/lib/hooks/useBookings';
import { useUnreadCount } from '@/lib/hooks/useNotifications';
import type { BookingListItem } from '@/lib/api/bookings';

const TYPE_BAR_COLORS: Record<string, string> = {
  regular: '#30D158',
  after_hours: '#FF9F0A',
  day_off: '#BF5AF2',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return { time: `${h12}:${m.toString().padStart(2, '0')}`, ampm };
}

function formatHeaderDate() {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function TodayScreen() {
  const router = useRouter();
  const colors = useColors();
  const confirm = useConfirmBooking();
  const cancel = useCancelBooking();
  const unread = useUnreadCount();

  const { data, isLoading, refetch } = useBookings({
    timeframe: 'upcoming',
  });

  const allBookings = useMemo(
    () => data?.pages.flatMap((p) => p.bookings) ?? [],
    [data],
  );

  const pending = useMemo(
    () => allBookings.filter((b) => b.status === 'pending'),
    [allBookings],
  );
  const confirmed = useMemo(
    () => allBookings.filter((b) => b.status === 'confirmed'),
    [allBookings],
  );
  const earnings = useMemo(
    () => confirmed.reduce((s, b) => s + b.totalPrice, 0),
    [confirmed],
  );

  const unreadCount = unread.data ?? 0;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.tertiary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1 px-5">
        <Header
          title="Today"
          subtitle={formatHeaderDate()}
          right={
            <Pressable
              onPress={() => router.push('/(app)/(tabs)/today/notifications')}
              className="p-[6px]"
              accessibilityLabel="Notifications"
              accessibilityRole="button"
            >
              <Icon name="bell" size={24} color={colors.ink} />
              {unreadCount > 0 && (
                <View className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red border-2 border-surface" />
              )}
            </Pressable>
          }
        />

        {/* Stats */}
        <View className="flex-row gap-[10px] mb-xl">
          <StatCard
            value={allBookings.filter((b) => b.status !== 'cancelled').length}
            label="Appointments"
            dark
          />
          <StatCard value={`$${earnings}`} label="Earnings" />
        </View>

        {/* Pending */}
        {pending.length > 0 && (
          <Section title="Pending">
            {pending.map((b) => (
              <PendingCard
                key={b.id}
                booking={b}
                onAccept={() => confirm.mutate(b.id)}
                onDecline={() => cancel.mutate(b.id)}
              />
            ))}
          </Section>
        )}

        {/* Schedule */}
        <Section
          title="Schedule"
          action="See All"
          onAction={() => router.push('/(app)/(tabs)/calendar')}
        >
          <Card elevated className="p-0 overflow-hidden">
            {confirmed.length === 0 && (
              <View className="py-8 items-center">
                <Text className="text-[14px] text-tertiary">
                  No confirmed bookings today
                </Text>
              </View>
            )}
            {confirmed.map((b, i) => (
              <ScheduleRow
                key={b.id}
                booking={b}
                last={i === confirmed.length - 1}
                onPress={() =>
                  router.push(`/(app)/(tabs)/today/${b.id}`)
                }
              />
            ))}
          </Card>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function PendingCard({
  booking: b,
  onAccept,
  onDecline,
}: {
  booking: BookingListItem;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const colors = useColors();
  const { time, ampm } = formatTime(b.scheduledAt);

  return (
    <Card elevated>
      <View className="flex-row items-center gap-3 mb-[14px]">
        <Avatar name={b.client.name} size={40} />
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-ink tracking-[-0.2px]">
            {b.client.name}
          </Text>
          <View className="flex-row items-center gap-[6px] mt-[3px]">
            <Text className="text-[13px] text-secondary">
              {b.service.name} · {time} {ampm}
            </Text>
            <TypeBadge type={b.bookingType} />
          </View>
        </View>
        <Text className="text-[18px] font-bold text-ink tracking-[-0.3px]">
          ${b.totalPrice}
        </Text>
      </View>

      <View className="flex-row gap-2">
        <Pressable
          onPress={onAccept}
          className="flex-1 flex-row items-center justify-center gap-[6px] py-[11px] rounded-sm bg-ink"
        >
          <Icon name="check" size={16} color="#FFF" />
          <Text className="text-[14px] font-semibold text-white">Accept</Text>
        </Pressable>
        <Pressable
          onPress={onDecline}
          className="flex-1 flex-row items-center justify-center gap-[6px] py-[11px] rounded-sm border-[1.5px] border-red/30 bg-red/[0.06]"
        >
          <Icon name="close" size={14} color={colors.red} />
          <Text className="text-[14px] font-semibold text-red">Decline</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function ScheduleRow({
  booking: b,
  last,
  onPress,
}: {
  booking: BookingListItem;
  last: boolean;
  onPress: () => void;
}) {
  const { time, ampm } = formatTime(b.scheduledAt);
  const barColor = TYPE_BAR_COLORS[b.bookingType] ?? '#30D158';
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-[14px] px-4 py-[14px] ${
        !last ? 'border-b border-separator' : ''
      }`}
    >
      <View className="items-center min-w-[44px]">
        <Text className="text-[17px] font-bold text-ink tracking-[-0.3px]">
          {time}
        </Text>
        <Text className="text-[11px] font-semibold text-tertiary">{ampm}</Text>
      </View>

      <View
        style={{ backgroundColor: barColor }}
        className="w-[3px] h-9 rounded-full"
      />

      <View className="flex-1">
        <View className="flex-row items-center gap-[5px]">
          {b.isRecurring && (
            <Icon name="loop" size={13} color={colors.blue} />
          )}
          <Text className="text-[15px] font-semibold text-ink tracking-[-0.2px]">
            {b.client.name}
          </Text>
        </View>
        <View className="flex-row items-center gap-[5px] mt-[2px]">
          <Text className="text-[13px] text-secondary">{b.service.name}</Text>
          <TypeBadge type={b.bookingType} />
        </View>
      </View>

      <Text className="text-[17px] font-bold text-ink tracking-[-0.3px]">
        ${b.totalPrice}
      </Text>
    </Pressable>
  );
}
