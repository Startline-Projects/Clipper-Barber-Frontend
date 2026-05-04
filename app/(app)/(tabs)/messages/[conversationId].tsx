import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import { useConversations } from '@/lib/hooks/useConversations';
import { useMessages, useSendMessage } from '@/lib/hooks/useMessages';
import { toast } from '@/lib/stores/toast';
import { getReadableError } from '@/lib/utils/get-readable-error';
import type { Message } from '@/lib/api/conversations';
import type { ErrorBoundaryProps } from 'expo-router';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-6 bg-bg">
      <Text className="text-[16px] font-semibold text-ink">Something went wrong</Text>
      <Text className="text-[14px] text-secondary text-center">{error.message}</Text>
      <Pressable onPress={retry} className="px-6 py-3 bg-blue rounded-sm">
        <Text className="text-white font-semibold">Try again</Text>
      </Pressable>
    </View>
  );
}

function formatMsgTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{
    conversationId: string;
  }>();
  const router = useRouter();
  const colors = useColors();
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState('');

  const convoQuery = useConversations({});
  const otherParty = useMemo(() => {
    const convos = convoQuery.data?.pages.flatMap((p) => p.conversations) ?? [];
    return convos.find((c) => c.id === conversationId)?.otherParty;
  }, [convoQuery.data, conversationId]);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useMessages(conversationId ?? '');
  const sendMut = useSendMessage(conversationId ?? '');

  const messages = data?.messages ?? [];

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || sendMut.isPending) return;
    sendMut.mutate(trimmed, {
      onError: (err) => toast.error(getReadableError(err)),
    });
    setText('');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="px-5">
        <Header
          title={otherParty?.name ?? 'Chat'}
          onBack={() => router.replace('/(app)/(tabs)/messages')}
          right={
            otherParty ? (
              <Avatar name={otherParty.name} uri={otherParty.profilePhotoUrl ?? undefined} size={32} />
            ) : undefined
          }
        />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.tertiary} />
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(m) => m.id}
            inverted
            contentContainerClassName="px-5 py-2"
            removeClippedSubviews={true}
            initialNumToRender={20}
            maxToRenderPerBatch={10}
            windowSize={7}
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
            renderItem={({ item: m }) => <MessageBubble message={m} />}
          />
        )}

        {/* Input bar */}
        <View className="flex-row items-center gap-[10px] px-5 py-3 border-t border-separator">
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={colors.tertiary}
            multiline
            style={{ borderColor: colors.tertiary }}
            className="flex-1 px-[18px] py-3 rounded-3xl border-[1.5px] bg-bg text-[15px] text-ink tracking-[-0.2px] max-h-[100px]"
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            className="w-[42px] h-[42px] rounded-full bg-ink items-center justify-center"
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            <Icon name="send" size={16} color={colors.bg} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message: m }: { message: Message }) {
  const isBarber = m.senderRole === 'barber';

  return (
    <View
      className={`flex-row mb-[6px] ${
        isBarber ? 'justify-end' : 'justify-start'
      }`}
    >
      <View
        className={`max-w-[78%] px-[14px] py-[10px] rounded-[20px] ${
          isBarber
            ? 'bg-ink rounded-br-[6px]'
            : 'bg-bg rounded-bl-[6px]'
        }`}
      >
        <Text
          className={`text-[15px] leading-[21px] tracking-[-0.2px] ${
            isBarber ? 'text-bg' : 'text-ink'
          }`}
        >
          {m.body}
        </Text>
        <Text
          className={`text-[11px] mt-1 text-right ${
            isBarber ? 'text-bg/40' : 'text-ink/40'
          }`}
        >
          {formatMsgTime(m.createdAt)}
        </Text>
      </View>
    </View>
  );
}
