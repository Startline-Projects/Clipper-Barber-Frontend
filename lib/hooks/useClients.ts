import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { queryKeys, type ClientsFilters } from './queryKeys';
import * as clientsApi from '@/lib/api/clients';
import type {
  ClientDetail,
  ClientListItem,
  ClientListResponse,
  GetClientDetailParams,
} from '@/lib/api/clients';
import type { InfiniteData } from '@tanstack/react-query';

function findClientInListCache(
  queryClient: ReturnType<typeof useQueryClient>,
  clientId: string,
): ClientListItem | undefined {
  const caches = queryClient.getQueriesData<InfiniteData<ClientListResponse>>({
    queryKey: queryKeys.clients.lists(),
  });
  for (const [, data] of caches) {
    if (!data) continue;
    for (const page of data.pages) {
      const hit = page.clients.find((c) => c.clientId === clientId);
      if (hit) return hit;
    }
  }
  return undefined;
}

function buildPlaceholderDetail(item: ClientListItem): ClientDetail {
  return {
    client: {
      id: item.clientId,
      name: item.name,
      profilePhotoUrl: item.profilePhotoUrl,
      email: item.email,
      createdAt: null,
      isGuest: item.isGuest,
    },
    stats: {
      totalVisits: item.totalVisits,
      totalSpendUsd: item.totalSpendUsd,
      averageSpendUsd:
        item.totalVisits > 0 ? item.totalSpendUsd / item.totalVisits : 0,
      firstVisitAt: item.firstVisitAt,
      lastVisitAt: item.lastVisitAt,
      noShowCount: 0,
      cancellationCount: 0,
      favouriteService: null,
    },
    upcomingBookings: [],
    pastBookings: {
      items: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        limit: 0,
        hasNextPage: false,
        totalBookings: 0,
      },
    },
    recurringSeries: [],
  };
}

export function useClients(filters: ClientsFilters) {
  const hasTokens = useAuthStore((s) => Boolean(s.accessToken));
  return useInfiniteQuery({
    queryKey: queryKeys.clients.list(filters),
    queryFn: ({ pageParam, signal }) =>
      clientsApi.listClients({ ...filters, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNextPage
        ? last.pagination.currentPage + 1
        : undefined,
    enabled: hasTokens,
    staleTime: 30_000,
  });
}

export function useClientDetail(
  clientId: string,
  params: GetClientDetailParams = {},
) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: [...queryKeys.clients.detail(clientId), params] as const,
    queryFn: ({ signal }) =>
      clientsApi.getClientDetail(clientId, params, { signal }),
    enabled: Boolean(clientId),
    staleTime: 30_000,
    placeholderData: () => {
      if (!clientId) return undefined;
      const item = findClientInListCache(queryClient, clientId);
      return item ? buildPlaceholderDetail(item) : undefined;
    },
  });
}

export function usePrefetchClientDetail() {
  const queryClient = useQueryClient();
  return (clientId: string, params: GetClientDetailParams = {}) => {
    if (!clientId) return;
    queryClient.prefetchQuery({
      queryKey: [...queryKeys.clients.detail(clientId), params] as const,
      queryFn: ({ signal }) =>
        clientsApi.getClientDetail(clientId, params, { signal }),
      staleTime: 30_000,
    });
  };
}
