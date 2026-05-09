import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import { useClients, usePrefetchClientDetail } from '@/lib/hooks/useClients';
import type { ClientListItem } from '@/lib/api/clients';

const SORT_OPTIONS = [
  { value: 'lastVisit', label: 'Recent' },
  { value: 'totalSpend', label: 'Top Spend' },
  { value: 'totalVisits', label: 'Most Visits' },
  { value: 'name', label: 'A-Z' },
] as const;

type SortBy = (typeof SORT_OPTIONS)[number]['value'];

function usd(amount: number): string {
  return `$${amount.toFixed(0)}`;
}

function shortDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ClientsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('lastVisit');

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } =
    useClients({ search: search.trim() || undefined, sortBy, order: 'desc' });
  const prefetchClientDetail = usePrefetchClientDetail();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const clients = data?.pages.flatMap((p) => p.clients) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="px-5">
        <Header title="Clients" onBack={() => router.back()} />
      </View>

      {/* Search */}
      <View className="px-5 mb-3">
        <View className="flex-row items-center gap-[10px] px-[14px] py-[10px] rounded-md border-[1.5px] border-separator-opaque bg-surface">
          <Icon name="search" size={16} color={colors.tertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search clients..."
            className="flex-1 text-lg text-ink tracking-[-0.2px]"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Icon name="close" size={14} color={colors.tertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Sort pills */}
      <View className="flex-row gap-2 px-5 mb-3">
        {SORT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setSortBy(opt.value)}
            className={`px-3 py-[7px] rounded-full border-[1.5px] ${
              sortBy === opt.value
                ? 'border-green bg-green'
                : 'border-separator-opaque bg-surface'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                sortBy === opt.value ? 'text-white' : 'text-ink'
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={clients}
        keyExtractor={(c) => c.clientId}
        contentContainerClassName="px-5 pb-8"
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
        renderItem={({ item }) => (
          <ClientRow
            client={item}
            onPress={() => {
              prefetchClientDetail(item.clientId);
              router.push(`/(app)/(tabs)/menu/clients/${item.clientId}`);
            }}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-16">
              <Icon name="user" size={36} color={colors.quaternary} />
              <Text className="text-lg text-tertiary mt-3">
                {search ? 'No matching clients' : 'No clients yet'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isFetchingNextPage || isLoading ? (
            <ActivityIndicator className="py-4" color={colors.tertiary} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function ClientRow({
  client: c,
  onPress,
}: {
  client: ClientListItem;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 py-[12px] border-b border-separator"
    >
      <Avatar
        name={c.name}
        uri={c.profilePhotoUrl ?? undefined}
        size={44}
      />
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-semibold text-ink tracking-[-0.2px]">
            {c.name}
          </Text>
          {c.isGuest && (
            <View className="px-[6px] py-[1px] rounded-xs bg-separator-opaque">
              <Text className="text-2xs font-bold text-tertiary tracking-[0.3px]">
                GUEST
              </Text>
            </View>
          )}
        </View>
        <Text className="text-sm text-tertiary mt-[2px]">
          {c.totalVisits} visits · {usd(c.totalSpendUsd)} · Last {shortDate(c.lastVisitAt)}
        </Text>
      </View>
      {c.hasUpcoming && (
        <View className="w-[8px] h-[8px] rounded-full bg-blue mr-1" />
      )}
      <Icon name="chevron" size={16} color={colors.quaternary} />
    </Pressable>
  );
}
