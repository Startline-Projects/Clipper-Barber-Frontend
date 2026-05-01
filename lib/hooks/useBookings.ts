import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { queryKeys, type BookingsFilters } from './queryKeys';
import { invalidations } from './invalidations';
import * as bookingsApi from '@/lib/api/bookings';
import type {
  BookingListItem,
  BookingDetail,
  BookingsListPage,
} from '@/lib/api/bookings';

export function useBookings(filters: BookingsFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.bookings.list(filters),
    queryFn: ({ pageParam, signal }) =>
      bookingsApi.listBookings(
        { ...filters, cursor: pageParam },
        { signal },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
    staleTime: 30_000,
  });
}

export function useBookingDetail(bookingId: string) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(bookingId),
    queryFn: ({ signal }) => bookingsApi.getBooking(bookingId, { signal }),
    enabled: Boolean(bookingId),
  });
}

// ---------- Optimistic helpers ----------

type BookingStatus = BookingListItem['status'];

interface OptimisticContext {
  previous: Map<string, InfiniteData<BookingsListPage> | undefined>;
  previousDetail: BookingDetail | undefined;
}

function applyStatusOptimistically(
  qc: ReturnType<typeof useQueryClient>,
  bookingId: string,
  status: BookingStatus,
): OptimisticContext {
  const previous = new Map<string, InfiniteData<BookingsListPage> | undefined>();

  qc.getQueriesData<InfiniteData<BookingsListPage>>({
    queryKey: queryKeys.bookings.lists(),
  }).forEach(([key, data]) => {
    previous.set(JSON.stringify(key), data);
    if (!data) return;

    qc.setQueryData<InfiniteData<BookingsListPage>>(key, {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        bookings: page.bookings.map((b) =>
          b.id === bookingId ? { ...b, status } : b,
        ),
      })),
    });
  });

  const previousDetail = qc.getQueryData<BookingDetail>(
    queryKeys.bookings.detail(bookingId),
  );
  if (previousDetail) {
    qc.setQueryData<BookingDetail>(queryKeys.bookings.detail(bookingId), {
      ...previousDetail,
      booking: { ...previousDetail.booking, status },
    });
  }

  return { previous, previousDetail };
}

function rollback(
  qc: ReturnType<typeof useQueryClient>,
  bookingId: string,
  ctx: OptimisticContext,
) {
  ctx.previous.forEach((data, keyStr) => {
    qc.setQueryData(JSON.parse(keyStr), data);
  });
  if (ctx.previousDetail) {
    qc.setQueryData(queryKeys.bookings.detail(bookingId), ctx.previousDetail);
  }
}

// ---------- Status mutations ----------

function makeStatusMutation(
  apiFn: (id: string) => Promise<unknown>,
  optimisticStatus: BookingStatus,
) {
  return () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: apiFn,
      onMutate: async (bookingId: string) => {
        await qc.cancelQueries({ queryKey: queryKeys.bookings.lists() });
        await qc.cancelQueries({
          queryKey: queryKeys.bookings.detail(bookingId),
        });
        return applyStatusOptimistically(qc, bookingId, optimisticStatus);
      },
      onError: (_err, bookingId, ctx) => {
        if (ctx) rollback(qc, bookingId, ctx);
      },
      onSettled: (_data, _err, bookingId) => {
        invalidations.bookingMutated(qc, bookingId);
      },
    });
  };
}

export const useConfirmBooking = makeStatusMutation(
  bookingsApi.confirmBooking,
  'confirmed',
);
export const useCancelBooking = makeStatusMutation(
  bookingsApi.cancelBooking,
  'cancelled',
);
export const useCompleteBooking = makeStatusMutation(
  bookingsApi.completeBooking,
  'completed',
);
export const useNoShowBooking = makeStatusMutation(
  bookingsApi.noShowBooking,
  'no_show',
);
