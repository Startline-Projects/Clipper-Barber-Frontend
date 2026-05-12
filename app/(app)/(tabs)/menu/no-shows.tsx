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
import TabBar from '@/components/ui/TabBar';
import Divider from '@/components/ui/Divider';
import Avatar from '@/components/ui/Avatar';
import StatusBadge from '@/components/ui/StatusBadge';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import {
  useBarberNoShows,
  useBarberNoShowStats,
} from '@/lib/hooks/useNoShows';
import type { NoShowItem, NoShowStatus } from '@/lib/api/no-shows';

const TABS = ['Unresolved', 'Resolved'] as const;
type Tab = (typeof TABS)[number];

const TAB_STATUS: Record<Tab, NoShowStatus | undefined> = {
  Unresolved: 'unresolved',
  Resolved: 'paid',
};

function usd(amount: number): string {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function NoShowsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [tab, setTab] = useState<Tab>('Unresolved');

  const stats = useBarberNoShowStats();
  const list = useBarberNoShows({ status: TAB_STATUS[tab], limit: 50 });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([stats.refetch(), list.refetch()]);
    setRefreshing(false);
  }, [stats, list]);

  const items = list.data?.items ?? [];

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
        <Header title="No-Show Payments" onBack={() => router.back()} />

        {/* Stats */}
        {stats.isLoading || !stats.data ? (
          <View className="items-center py-10">
            <ActivityIndicator color={colors.tertiary} />
          </View>
        ) : (
          <>
            <Card elevated className="items-center py-6 mb-lg">
              <Text className="text-sm font-semibold text-tertiary tracking-[0.3px] uppercase mb-1">
                Collected From No-Shows
              </Text>
              <Text className="text-[42px] font-extrabold text-ink tracking-[-1.5px]">
                {usd(stats.data.totalEarningsUsd)}
              </Text>
              <Text className="text-base text-quaternary mt-1">
                {stats.data.resolvedCount} paid · {stats.data.unresolvedCount} owed
              </Text>
            </Card>

            <View className="flex-row gap-3 mb-lg">
              <SummaryTile
                label="Owed"
                amount={stats.data.unresolvedAmountUsd}
                count={stats.data.unresolvedCount}
                accent={colors.orange}
              />
              <SummaryTile
                label="Paid"
                amount={stats.data.resolvedAmountUsd}
                count={stats.data.resolvedCount}
                accent={colors.green}
              />
            </View>
          </>
        )}

        <TabBar
          tabs={[...TABS]}
          active={tab}
          onChange={(t) => setTab(t as Tab)}
        />

        {/* Info banner */}
        <View className="flex-row items-start gap-2 p-3 rounded-md bg-blue/8 border border-blue/20 mb-lg">
          <Icon name="info" size={14} color={colors.blue} />
          <Text className="flex-1 text-sm text-secondary leading-[17px]">
            Clients pay no-show fees directly from their app. You'll see them
            here once they settle.
          </Text>
        </View>

        {list.isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color={colors.tertiary} />
          </View>
        ) : items.length === 0 ? (
          <Card elevated className="items-center py-10">
            <Icon name="shield" size={28} color={colors.quaternary} />
            <Text className="text-base text-tertiary mt-3">
              {tab === 'Unresolved'
                ? 'No outstanding no-shows'
                : 'No paid no-shows yet'}
            </Text>
          </Card>
        ) : (
          <Card elevated className="p-0 overflow-hidden">
            {items.map((it, i) => (
              <View key={it.id}>
                {i > 0 && <Divider />}
                <NoShowRow item={it} />
              </View>
            ))}
          </Card>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryTile({
  label,
  amount,
  count,
  accent,
}: {
  label: string;
  amount: number;
  count: number;
  accent: string;
}) {
  return (
    <View
      className="flex-1 rounded-md p-4 bg-surface"
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <Text className="text-xs font-semibold text-tertiary tracking-[0.3px] uppercase mb-1">
        {label}
      </Text>
      <Text className="text-2xl font-extrabold text-ink tracking-[-0.5px]">
        {usd(amount)}
      </Text>
      <Text className="text-sm text-quaternary mt-[2px]">
        {count} {count === 1 ? 'no-show' : 'no-shows'}
      </Text>
    </View>
  );
}

function NoShowRow({ item }: { item: NoShowItem }) {
  const badgeStatus =
    item.status === 'paid'
      ? 'charged'
      : item.status === 'failed'
        ? 'failed_payment'
        : item.status === 'pending_payment'
          ? 'pending'
          : item.status === 'unresolved'
            ? 'no_show'
            : item.status;

  return (
    <View className="flex-row items-center gap-3 px-4 py-[14px]">
      <Avatar
        name={item.counterparty.name}
        size={40}
        uri={item.counterparty.profilePhotoUrl ?? undefined}
      />
      <View className="flex-1">
        <Text
          className="text-lg font-semibold text-ink tracking-[-0.2px]"
          numberOfLines={1}
        >
          {item.counterparty.name}
        </Text>
        <Text className="text-sm text-tertiary mt-[1px]" numberOfLines={1}>
          {item.booking.serviceName ?? 'Service'} · {formatDate(item.booking.scheduledAt)}
        </Text>
        <View className="mt-[6px] self-start">
          <StatusBadge status={badgeStatus} />
        </View>
      </View>
      <Text className="text-[16px] font-bold text-ink tracking-[-0.3px]">
        {usd(item.amountUsd)}
      </Text>
    </View>
  );
}
