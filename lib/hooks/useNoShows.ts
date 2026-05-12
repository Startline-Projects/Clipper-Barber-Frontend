import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import * as noShowsApi from '@/lib/api/no-shows';
import type { NoShowsFilters } from '@/lib/api/no-shows';

export function useBarberNoShows(filters: NoShowsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.noShows.list({
      status: filters.status,
      page: filters.page,
      limit: filters.limit,
    }),
    queryFn: ({ signal }) => noShowsApi.listBarberNoShows(filters, { signal }),
  });
}

export function useBarberNoShowStats() {
  return useQuery({
    queryKey: queryKeys.noShows.stats(),
    queryFn: ({ signal }) => noShowsApi.getBarberNoShowStats({ signal }),
  });
}
