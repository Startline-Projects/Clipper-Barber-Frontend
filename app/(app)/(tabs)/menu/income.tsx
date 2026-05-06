import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import TabBar from '@/components/ui/TabBar';
import Divider from '@/components/ui/Divider';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import type { Analytics, ArrangementAnalytics } from '@/lib/api/analytics';

const PERIODS = ['Week', 'Month', 'Year'] as const;
const PERIOD_MAP = { Week: 'week', Month: 'month', Year: 'year' } as const;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function usd(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function IncomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const [tab, setTab] = useState<(typeof PERIODS)[number]>('Week');
  const period = PERIOD_MAP[tab];

  const { data, isLoading, refetch } = useAnalytics(period);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1 px-5" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tertiary} />}>
        <Header title="Income" onBack={() => router.back()} />

        <TabBar
          tabs={[...PERIODS]}
          active={tab}
          onChange={(t) => setTab(t as typeof tab)}
        />

        {isLoading || !data ? (
          <View className="items-center py-16">
            <ActivityIndicator color={colors.tertiary} />
          </View>
        ) : (
          <>
            {/* Total earnings */}
            <Card elevated className="items-center py-6 mb-lg">
              <Text className="text-sm font-semibold text-tertiary tracking-[0.3px] uppercase mb-1">
                Total Earnings
              </Text>
              <Text className="text-[42px] font-extrabold text-ink tracking-[-1.5px]">
                {usd(data.total_earnings_usd)}
              </Text>
              <Text className="text-base text-quaternary mt-1">
                {data.period_days} days · {data.window_start.slice(0, 10)} → {data.window_end.slice(0, 10)}
              </Text>
            </Card>

            {/* Standard bookings breakdown */}
            <Card elevated>
              <Text className="text-base font-bold text-secondary tracking-[0.3px] uppercase mb-3">
                Standard Bookings
              </Text>

              <EarningsRow
                label="Regular"
                count={data.standard_bookings.regular.count}
                amount={data.standard_bookings.regular.total_usd}
                dotColor="#30D158"
              />
              <Divider />
              <EarningsRow
                label="After-Hours"
                count={data.standard_bookings.after_hours.count}
                amount={data.standard_bookings.after_hours.total_usd}
                dotColor="#FF9F0A"
              />
              <Divider />
              <EarningsRow
                label="Day-Off"
                count={data.standard_bookings.day_off.count}
                amount={data.standard_bookings.day_off.total_usd}
                dotColor="#BF5AF2"
              />
            </Card>

            {/* Recurring */}
            <Card elevated>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-bold text-secondary tracking-[0.3px] uppercase">
                  Recurring
                </Text>
                <Text className="text-base font-semibold text-ink">
                  {usd(data.recurring.total_usd)}
                </Text>
              </View>
              <Text className="text-sm text-tertiary mb-3">
                {data.recurring.total_occurrences_completed} completed this {tab.toLowerCase()}
              </Text>

              {data.recurring.per_arrangement.length > 0 ? (
                data.recurring.per_arrangement.map((arr, i) => (
                  <View key={arr.arrangement_id}>
                    {i > 0 && <Divider />}
                    <ArrangementRow arrangement={arr} />
                  </View>
                ))
              ) : (
                <Text className="text-base text-quaternary py-2">
                  No recurring earnings this period
                </Text>
              )}
            </Card>

            <View className="h-8" />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EarningsRow({
  label,
  count,
  amount,
  dotColor,
}: {
  label: string;
  count: number;
  amount: number;
  dotColor: string;
}) {
  return (
    <View className="flex-row items-center py-[12px] gap-3">
      <View
        className="w-[10px] h-[10px] rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      <View className="flex-1">
        <Text className="text-lg font-semibold text-ink tracking-[-0.2px]">
          {label}
        </Text>
        <Text className="text-sm text-tertiary mt-[1px]">
          {count} booking{count !== 1 ? 's' : ''}
        </Text>
      </View>
      <Text className="text-[16px] font-bold text-ink tracking-[-0.3px]">
        {usd(amount)}
      </Text>
    </View>
  );
}

function ArrangementRow({ arrangement: a }: { arrangement: ArrangementAnalytics }) {
  return (
    <View className="flex-row items-center py-[12px] gap-3">
      <View className="flex-1">
        <Text className="text-md font-semibold text-ink tracking-[-0.2px]">
          {a.client_name}
        </Text>
        <Text className="text-sm text-tertiary mt-[1px]">
          {a.service_name} · {DAY_LABELS[a.day_of_week]}s {a.time_slot} · {a.frequency}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-md font-bold text-ink">{usd(a.total_usd)}</Text>
        <Text className="text-xs text-quaternary">
          {a.occurrences_completed}×
        </Text>
      </View>
    </View>
  );
}
