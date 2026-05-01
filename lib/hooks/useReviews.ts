import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { queryKeys, type ReviewsFilters } from './queryKeys';
import * as reviewsApi from '@/lib/api/reviews';

export function useReviews(filters: ReviewsFilters) {
  const hasTokens = useAuthStore((s) => Boolean(s.accessToken));
  return useInfiniteQuery({
    queryKey: queryKeys.reviews.list(filters),
    queryFn: ({ pageParam, signal }) =>
      reviewsApi.listReviews({ ...filters, cursor: pageParam }, { signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.hasMore ? last.nextCursor ?? undefined : undefined,
    enabled: hasTokens,
    staleTime: 60_000,
  });
}

export function useReviewsAnalytics() {
  const hasTokens = useAuthStore((s) => Boolean(s.accessToken));
  return useQuery({
    queryKey: queryKeys.reviews.summary(),
    queryFn: ({ signal }) => reviewsApi.getReviewsAnalytics({ signal }),
    enabled: hasTokens,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
