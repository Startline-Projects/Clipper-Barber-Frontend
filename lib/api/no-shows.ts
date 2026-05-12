import { z } from 'zod';
import { apiClient } from './client';

// ---------- Schemas ----------

const NoShowStatusSchema = z.enum([
  'unresolved',
  'pending_payment',
  'paid',
  'failed',
  'refunded',
]);

const NoShowBookingSchema = z.object({
  id: z.string(),
  scheduledAt: z.string(),
  serviceName: z.string().nullable(),
});

const NoShowCounterpartySchema = z.object({
  id: z.string(),
  name: z.string(),
  profilePhotoUrl: z.string().nullable(),
});

const NoShowItemSchema = z.object({
  id: z.string(),
  status: NoShowStatusSchema,
  amountUsd: z.number(),
  currency: z.string(),
  reason: z.string().nullable(),
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
  booking: NoShowBookingSchema,
  counterparty: NoShowCounterpartySchema,
});

const PaginationSchema = z.object({
  currentPage: z.number(),
  totalPages: z.number(),
  totalItems: z.number(),
  limit: z.number(),
  hasNextPage: z.boolean(),
});

const NoShowListSchema = z.object({
  items: z.array(NoShowItemSchema),
  pagination: PaginationSchema,
});

const NoShowStatsSchema = z.object({
  stats: z.object({
    unresolvedCount: z.number(),
    unresolvedAmountUsd: z.number(),
    resolvedCount: z.number(),
    resolvedAmountUsd: z.number(),
    totalEarningsUsd: z.number(),
  }),
});

// ---------- Types ----------

export type NoShowStatus = z.infer<typeof NoShowStatusSchema>;
export type NoShowItem = z.infer<typeof NoShowItemSchema>;
export type NoShowList = z.infer<typeof NoShowListSchema>;
export type NoShowStats = z.infer<typeof NoShowStatsSchema>['stats'];

export interface NoShowsFilters {
  status?: NoShowStatus;
  page?: number;
  limit?: number;
}

interface RequestOptions {
  signal?: AbortSignal;
}

function extractPayload<T>(res: unknown): T {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

// ---------- Endpoints ----------

export async function listBarberNoShows(
  filters: NoShowsFilters = {},
  opts: RequestOptions = {},
): Promise<NoShowList> {
  const { data: res } = await apiClient.get('/barber/no-shows', {
    params: {
      status: filters.status,
      page: filters.page,
      limit: filters.limit,
    },
    signal: opts.signal,
  });
  return NoShowListSchema.parse(extractPayload(res));
}

export async function getBarberNoShowStats(
  opts: RequestOptions = {},
): Promise<NoShowStats> {
  const { data: res } = await apiClient.get('/barber/no-shows/stats', {
    signal: opts.signal,
  });
  return NoShowStatsSchema.parse(extractPayload(res)).stats;
}
