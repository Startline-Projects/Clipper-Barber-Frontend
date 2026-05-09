import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { queryKeys, type ConversationsFilters } from './queryKeys';
import * as convoApi from '@/lib/api/conversations';

export function useConversations(filters: ConversationsFilters) {
  const hasTokens = useAuthStore((s) => Boolean(s.accessToken));
  return useInfiniteQuery({
    queryKey: queryKeys.conversations.list(filters),
    queryFn: ({ pageParam, signal }) =>
      convoApi.listConversations({ ...filters, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNextPage
        ? last.pagination.currentPage + 1
        : undefined,
    enabled: hasTokens,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useUnreadChatsCount() {
  const hasTokens = useAuthStore((s) => Boolean(s.accessToken));
  return useQuery({
    queryKey: [...queryKeys.conversations.all, 'unreadChatsCount'] as const,
    queryFn: async ({ signal }) => {
      const res = await convoApi.listConversations({ limit: 100 }, { signal });
      return res.conversations.reduce(
        (n, c) => (c.unreadCount > 0 ? n + 1 : n),
        0,
      );
    },
    enabled: hasTokens,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => convoApi.startConversation(clientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.conversations.lists() });
    },
  });
}
