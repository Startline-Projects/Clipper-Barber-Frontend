import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { queryKeys } from './queryKeys';
import * as analyticsApi from '@/lib/api/analytics';
import type { z } from 'zod';
import type { AnalyticsPeriod } from '@/lib/schemas/enums';

type Period = z.infer<typeof AnalyticsPeriod>;

export function useAnalytics(period: Period) {
  const hasTokens = useAuthStore((s) => Boolean(s.accessToken));
  return useQuery({
    queryKey: queryKeys.analytics.revenue(period),
    queryFn: ({ signal }) => analyticsApi.getAnalytics(period, { signal }),
    enabled: hasTokens,
    staleTime: 60_000,
  });
}
