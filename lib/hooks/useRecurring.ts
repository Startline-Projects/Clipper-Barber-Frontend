import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { queryKeys, type RecurringFilters } from './queryKeys';
import { invalidations } from './invalidations';
import * as recurringApi from '@/lib/api/recurring';
import type {
  RecurringListItem,
  RecurringDetail,
  RecurringListPage,
} from '@/lib/api/recurring';
import type { z } from 'zod';
import type { RecurringStatus } from '@/lib/schemas/enums';

type Status = z.infer<typeof RecurringStatus>;

export function useRecurringBookings(filters: RecurringFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.recurring.list(filters),
    queryFn: ({ pageParam, signal }) =>
      recurringApi.listRecurring({ ...filters, cursor: pageParam }, { signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.hasMore ? last.nextCursor ?? undefined : undefined,
    staleTime: 30_000,
  });
}

export function useRecurringDetail(recurringId: string) {
  return useQuery({
    queryKey: queryKeys.recurring.detail(recurringId),
    queryFn: ({ signal }) => recurringApi.getRecurring(recurringId, { signal }),
    enabled: Boolean(recurringId),
  });
}

// ---------- Optimistic helpers ----------

interface OptimisticContext {
  previousLists: Map<string, InfiniteData<RecurringListPage> | undefined>;
  previousDetail: RecurringDetail | undefined;
}

function applyStatusOptimistically(
  qc: ReturnType<typeof useQueryClient>,
  recurringId: string,
  status: Status,
): OptimisticContext {
  const previousLists = new Map<
    string,
    InfiniteData<RecurringListPage> | undefined
  >();

  qc.getQueriesData<InfiniteData<RecurringListPage>>({
    queryKey: queryKeys.recurring.lists(),
  }).forEach(([key, data]) => {
    previousLists.set(JSON.stringify(key), data);
    if (!data) return;

    qc.setQueryData<InfiniteData<RecurringListPage>>(key, {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        recurringBookings: page.recurringBookings.map((r) =>
          r.id === recurringId ? { ...r, status } : r,
        ),
      })),
    });
  });

  const previousDetail = qc.getQueryData<RecurringDetail>(
    queryKeys.recurring.detail(recurringId),
  );
  if (previousDetail) {
    qc.setQueryData<RecurringDetail>(
      queryKeys.recurring.detail(recurringId),
      {
        ...previousDetail,
        recurringBooking: { ...previousDetail.recurringBooking, status },
      },
    );
  }

  return { previousLists, previousDetail };
}

function rollback(
  qc: ReturnType<typeof useQueryClient>,
  recurringId: string,
  ctx: OptimisticContext,
) {
  ctx.previousLists.forEach((data, keyStr) => {
    qc.setQueryData(JSON.parse(keyStr), data);
  });
  if (ctx.previousDetail) {
    qc.setQueryData(queryKeys.recurring.detail(recurringId), ctx.previousDetail);
  }
}

// ---------- Variables ----------

export interface DeclineRecurringVariables {
  recurringId: string;
  reason?: string;
}

export interface PauseRecurringVariables {
  recurringId: string;
  body: recurringApi.PauseBody;
}

// ---------- Mutations ----------

export function useAcceptRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recurringApi.acceptRecurring(id),
    onSuccess: (_data, recurringId) =>
      invalidations.recurringMutated(qc, recurringId),
  });
}

export function useDeclineRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recurringId, reason }: DeclineRecurringVariables) =>
      recurringApi.declineRecurring(recurringId, reason),
    onMutate: async ({ recurringId }) => {
      await qc.cancelQueries({ queryKey: queryKeys.recurring.lists() });
      await qc.cancelQueries({
        queryKey: queryKeys.recurring.detail(recurringId),
      });
      return applyStatusOptimistically(qc, recurringId, 'cancelled');
    },
    onError: (_err, vars, ctx) => {
      if (ctx) rollback(qc, vars.recurringId, ctx);
    },
    onSettled: (_data, _err, vars) =>
      invalidations.recurringMutated(qc, vars.recurringId),
  });
}

export function usePauseRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recurringId, body }: PauseRecurringVariables) =>
      recurringApi.pauseRecurring(recurringId, body),
    onMutate: async ({ recurringId }) => {
      await qc.cancelQueries({ queryKey: queryKeys.recurring.lists() });
      await qc.cancelQueries({
        queryKey: queryKeys.recurring.detail(recurringId),
      });
      return applyStatusOptimistically(qc, recurringId, 'paused');
    },
    onError: (_err, vars, ctx) => {
      if (ctx) rollback(qc, vars.recurringId, ctx);
    },
    onSettled: (_data, _err, vars) =>
      invalidations.recurringMutated(qc, vars.recurringId),
  });
}

export function useResumeRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recurringApi.resumeRecurring(id),
    onMutate: async (recurringId: string) => {
      await qc.cancelQueries({ queryKey: queryKeys.recurring.lists() });
      await qc.cancelQueries({
        queryKey: queryKeys.recurring.detail(recurringId),
      });
      return applyStatusOptimistically(qc, recurringId, 'active');
    },
    onError: (_err, recurringId, ctx) => {
      if (ctx) rollback(qc, recurringId, ctx);
    },
    onSettled: (_data, _err, recurringId) =>
      invalidations.recurringMutated(qc, recurringId),
  });
}

export function useCancelRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recurringApi.cancelRecurring(id),
    onMutate: async (recurringId: string) => {
      await qc.cancelQueries({ queryKey: queryKeys.recurring.lists() });
      await qc.cancelQueries({
        queryKey: queryKeys.recurring.detail(recurringId),
      });
      return applyStatusOptimistically(qc, recurringId, 'cancelled');
    },
    onError: (_err, recurringId, ctx) => {
      if (ctx) rollback(qc, recurringId, ctx);
    },
    onSettled: (_data, _err, recurringId) =>
      invalidations.recurringMutated(qc, recurringId),
  });
}
