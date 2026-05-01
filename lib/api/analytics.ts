import { z } from 'zod';
import { apiClient } from './client';
import { AnalyticsPeriod, RecurringFrequency } from '@/lib/schemas/enums';

// ---------- Response schemas ----------

const BookingTierSchema = z.object({
  count: z.number(),
  total_usd: z.number(),
});

const ArrangementSchema = z.object({
  arrangement_id: z.string(),
  client_name: z.string(),
  service_name: z.string(),
  day_of_week: z.number(),
  time_slot: z.string(),
  frequency: RecurringFrequency,
  occurrences_completed: z.number(),
  total_usd: z.number(),
});

const AnalyticsResponseSchema = z.object({
  period: AnalyticsPeriod,
  period_days: z.number(),
  window_start: z.string(),
  window_end: z.string(),
  total_earnings_usd: z.number(),
  standard_bookings: z.object({
    regular: BookingTierSchema,
    after_hours: BookingTierSchema,
    day_off: BookingTierSchema,
  }),
  recurring: z.object({
    total_occurrences_completed: z.number(),
    total_usd: z.number(),
    per_arrangement: z.array(ArrangementSchema),
  }),
});

// ---------- Public types ----------

export type Analytics = z.infer<typeof AnalyticsResponseSchema>;
export type ArrangementAnalytics = z.infer<typeof ArrangementSchema>;

interface RequestOptions {
  signal?: AbortSignal;
}

// ---------- Helpers ----------

function extractPayload<T>(res: unknown): T {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

// ---------- Endpoints ----------

export async function getAnalytics(
  period: z.infer<typeof AnalyticsPeriod>,
  opts: RequestOptions = {},
): Promise<Analytics> {
  const { data: res } = await apiClient.get('/bookings/analytics', {
    params: { period },
    signal: opts.signal,
  });
  return AnalyticsResponseSchema.parse(extractPayload(res));
}
