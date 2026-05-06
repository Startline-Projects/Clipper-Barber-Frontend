import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { invalidations } from './invalidations';
import * as convoApi from '@/lib/api/conversations';
import type { Message, MessagesListResponse } from '@/lib/api/conversations';

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages.list(conversationId),
    queryFn: ({ pageParam, signal }) =>
      convoApi.listMessages(conversationId, { before: pageParam }, { signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.hasMore ? last.nextCursor ?? undefined : undefined,
    enabled: Boolean(conversationId),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    select: (data) => ({
      ...data,
      // API returns each page oldest-first; pages are ordered newest-page-first
      // (cursor `before` walks backwards). Reverse within each page so the
      // inverted FlatList gets a flat newest→oldest stream across page boundaries.
      messages: data.pages.flatMap((p) => [...p.messages].reverse()),
    }),
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => convoApi.sendMessage(conversationId, body),
    onMutate: async (body) => {
      await qc.cancelQueries({
        queryKey: queryKeys.messages.list(conversationId),
      });

      const previous = qc.getQueryData<InfiniteData<MessagesListResponse>>(
        queryKeys.messages.list(conversationId),
      );

      const optimisticMessage: Message = {
        id: `optimistic-${Date.now()}`,
        conversationId,
        senderRole: 'barber',
        body,
        readAt: null,
        createdAt: new Date().toISOString(),
      };

      qc.setQueryData<InfiniteData<MessagesListResponse>>(
        queryKeys.messages.list(conversationId),
        (old) => {
          if (!old) return old;
          const pages = [...old.pages];
          pages[0] = {
            ...pages[0],
            messages: [...pages[0].messages, optimisticMessage],
          };
          return { ...old, pages };
        },
      );

      return { previous };
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(
          queryKeys.messages.list(conversationId),
          ctx.previous,
        );
      }
    },
    onSettled: () => invalidations.messageSent(qc, conversationId),
  });
}
