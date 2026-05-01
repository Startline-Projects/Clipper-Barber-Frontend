import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Section from '@/components/ui/Section';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import Divider from '@/components/ui/Divider';
import TypeBadge from '@/components/ui/TypeBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import Btn from '@/components/ui/Btn';
import { useColors } from '@/lib/theme/colors';
import { useClientDetail } from '@/lib/hooks/useClients';
import type { ClientBooking, ClientRecurring } from '@/lib/api/clients';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function usd(n: number): string {
  return `$${n.toFixed(0)}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear() % 100}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export default function ClientDetailScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const colors = useColors();
  const { data, isLoading } = useClientDetail(clientId ?? '');

  if (isLoading || !data) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-5">
          <Header title="Client" onBack={() => router.back()} />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.tertiary} />
        </View>
      </SafeAreaView>
    );
  }

  const { client, stats } = data;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1 px-5">
        <Header title="Client" onBack={() => router.back()} />

        {/* Client header */}
        <View className="items-center pb-4">
          <Avatar
            name={client.name}
            uri={client.profilePhotoUrl ?? undefined}
            size={72}
          />
          <Text className="text-[20px] font-bold text-ink tracking-[-0.4px] mt-3">
            {client.name}
          </Text>
          {client.email && (
            <Text className="text-[13px] text-tertiary mt-1">
              {client.email}
            </Text>
          )}
          {client.isGuest && (
            <View className="mt-2 px-2 py-[2px] rounded-xs bg-separator-opaque">
              <Text className="text-[11px] font-bold text-tertiary tracking-[0.3px]">
                GUEST
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View className="flex-row gap-3 mb-lg">
          <View className="flex-1">
            <Btn
              label="Message"
              variant="ghost"
              full
              onPress={() =>
                router.push(`/(app)/(tabs)/menu/clients/${clientId}/message`)
              }
            />
          </View>
          <View className="flex-1">
            <Btn
              label="New Recurring"
              full
              onPress={() =>
                router.push(
                  `/(app)/(tabs)/menu/clients/${clientId}/create-recurring`,
                )
              }
            />
          </View>
        </View>

        {/* Stats */}
        <Card elevated>
          <StatRow label="Total Visits" value={stats.totalVisits.toString()} />
          <Divider />
          <StatRow label="Total Spend" value={usd(stats.totalSpendUsd)} />
          <Divider />
          <StatRow label="Avg Spend" value={usd(stats.averageSpendUsd)} />
          <Divider />
          <StatRow
            label="Favourite Service"
            value={stats.favouriteService?.name ?? '—'}
          />
          <Divider />
          <StatRow
            label="First Visit"
            value={stats.firstVisitAt ? formatDate(stats.firstVisitAt) : '—'}
          />
          <Divider />
          <StatRow
            label="Last Visit"
            value={stats.lastVisitAt ? formatDate(stats.lastVisitAt) : '—'}
          />
          {(stats.noShowCount > 0 || stats.cancellationCount > 0) && (
            <>
              <Divider />
              <StatRow
                label="No-Shows / Cancels"
                value={`${stats.noShowCount} / ${stats.cancellationCount}`}
                warn={stats.noShowCount > 0}
              />
            </>
          )}
        </Card>

        {/* Upcoming */}
        {data.upcomingBookings.length > 0 && (
          <Section title="Upcoming">
            <Card elevated className="p-0 overflow-hidden">
              {data.upcomingBookings.map((b, i) => (
                <View key={b.id}>
                  {i > 0 && <Divider />}
                  <BookingRow booking={b} />
                </View>
              ))}
            </Card>
          </Section>
        )}

        {/* Recurring */}
        {data.recurringSeries.length > 0 && (
          <Section title="Recurring">
            <Card elevated className="p-0 overflow-hidden">
              {data.recurringSeries.map((r, i) => (
                <View key={r.id}>
                  {i > 0 && <Divider />}
                  <RecurringRow recurring={r} />
                </View>
              ))}
            </Card>
          </Section>
        )}

        {/* Past bookings */}
        {data.pastBookings.items.length > 0 && (
          <Section title={`Past (${data.pastBookings.pagination.totalBookings})`}>
            <Card elevated className="p-0 overflow-hidden">
              {data.pastBookings.items.map((b, i) => (
                <View key={b.id}>
                  {i > 0 && <Divider />}
                  <BookingRow booking={b} />
                </View>
              ))}
            </Card>
          </Section>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatRow({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-[11px]">
      <Text className="text-[14px] text-secondary">{label}</Text>
      <Text
        className={`text-[14px] font-semibold tracking-[-0.1px] ${
          warn ? 'text-red' : 'text-ink'
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

function BookingRow({ booking: b }: { booking: ClientBooking }) {
  const serviceNames = b.services.map((s) => s.name).join(', ');
  return (
    <View className="px-4 py-[12px]">
      <View className="flex-row items-center justify-between mb-[4px]">
        <Text className="text-[14px] font-semibold text-ink tracking-[-0.2px]">
          {serviceNames}
        </Text>
        <Text className="text-[14px] font-bold text-ink">
          {usd(b.totalPriceUsd)}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="text-[12px] text-tertiary">
          {formatDate(b.scheduledAt)} · {formatTime(b.scheduledAt)} ·{' '}
          {b.totalDurationMinutes}min
        </Text>
        <TypeBadge type={b.bookingType} />
        <StatusBadge status={b.status} />
      </View>
    </View>
  );
}

function RecurringRow({ recurring: r }: { recurring: ClientRecurring }) {
  return (
    <View className="px-4 py-[12px]">
      <View className="flex-row items-center justify-between mb-[4px]">
        <Text className="text-[14px] font-semibold text-ink tracking-[-0.2px]">
          {r.service.name}
        </Text>
        <Text className="text-[14px] font-bold text-ink">{usd(r.priceUsd)}</Text>
      </View>
      <Text className="text-[12px] text-tertiary">
        {DAY_LABELS[r.dayOfWeek]}s · {r.slotTime} · {r.frequency}
        {r.nextOccurrenceAt ? ` · Next ${formatDate(r.nextOccurrenceAt)}` : ''}
      </Text>
      <View className="flex-row items-center gap-2 mt-1">
        <View
          className={`px-[6px] py-[1px] rounded-xs ${
            r.active ? 'bg-green/12' : 'bg-separator-opaque'
          }`}
        >
          <Text
            className={`text-[10px] font-bold tracking-[0.3px] ${
              r.active ? 'text-green' : 'text-tertiary'
            }`}
          >
            {r.status.replace(/_/g, ' ').toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}
