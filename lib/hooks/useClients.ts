import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { queryKeys, type ClientsFilters } from './queryKeys';
import * as clientsApi from '@/lib/api/clients';
import type { GetClientDetailParams } from '@/lib/api/clients';

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
  return useQuery({
    queryKey: [...queryKeys.clients.detail(clientId), params] as const,
    queryFn: ({ signal }) =>
      clientsApi.getClientDetail(clientId, params, { signal }),
    enabled: Boolean(clientId),
    staleTime: 30_000,
  });
}
