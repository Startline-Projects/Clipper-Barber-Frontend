import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import { useConversations } from '@/lib/hooks/useConversations';
import type { Conversation } from '@/lib/api/conversations';

function timeAgo(iso: string | null) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function MessagesScreen() {
  const router = useRouter();
  const colors = useColors();

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useConversations({});

  const conversations = useMemo(
    () => data?.pages.flatMap((p) => p.conversations) ?? [],
    [data],
  );

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="px-5">
        <Header title="Messages" />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.tertiary} />
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-5">
          <View className="w-14 h-14 rounded-full bg-bg items-center justify-center mb-4">
            <Icon name="chat" size={24} color={colors.tertiary} />
          </View>
          <Text className="text-[15px] font-medium text-tertiary">
            No messages yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          contentContainerClassName="px-5"
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator className="py-4" color={colors.tertiary} />
            ) : null
          }
          renderItem={({ item: c, index }) => (
            <ConversationRow
              conversation={c}
              last={index === conversations.length - 1}
              onPress={() =>
                router.push(`/(app)/(tabs)/messages/${c.id}`)
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function ConversationRow({
  conversation: c,
  last,
  onPress,
}: {
  conversation: Conversation;
  last: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const hasUnread = c.unreadCount > 0;

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-[14px] bg-card ${
        !last ? 'border-b border-separator' : ''
      }`}
    >
      <View className="relative">
        <Avatar name={c.otherParty.name} size={46} />
        {hasUnread && (
          <View className="absolute -top-[1px] -right-[1px] w-3 h-3 rounded-full bg-blue border-[2.5px] border-surface" />
        )}
      </View>

      <View className="flex-1 min-w-0">
        <View className="flex-row justify-between items-baseline">
          <Text
            className={`text-[15px] tracking-[-0.2px] ${
              hasUnread ? 'font-bold text-ink' : 'font-medium text-ink'
            }`}
            numberOfLines={1}
          >
            {c.otherParty.name}
          </Text>
          <Text className="text-[12px] text-tertiary font-medium shrink-0 ml-2">
            {timeAgo(c.lastMessageAt)}
          </Text>
        </View>
        <Text
          className={`text-[14px] tracking-[-0.1px] mt-[2px] ${
            hasUnread ? 'font-medium text-ink' : 'text-tertiary'
          }`}
          numberOfLines={1}
        >
          {c.lastMessageBody ?? 'No messages yet'}
        </Text>
      </View>

      <Icon name="chevron" size={16} color={colors.quaternary} />
    </Pressable>
  );
}
