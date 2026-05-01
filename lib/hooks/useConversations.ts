import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => convoApi.startConversation(clientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.conversations.lists() });
    },
  });
}
