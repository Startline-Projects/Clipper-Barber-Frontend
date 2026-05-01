import { z } from 'zod';
import { apiClient } from './client';
import {
  RecurringStatus,
  RecurringFrequency,
  BookingStatus,
  CancelledBy,
} from '@/lib/schemas/enums';

// ---------- Response schemas ----------

const RecurringListItemSchema = z.object({
  id: z.string(),
  status: RecurringStatus,
  isRenewal: z.boolean(),
  dayOfWeek: z.number(),
  slotTime: z.string(),
  frequency: RecurringFrequency,
  priceUsd: z.number(),
  service: z.object({
    id: z.string(),
    name: z.string(),
    durationMinutes: z.number(),
  }),
  barber: z.object({ id: z.string(), name: z.string() }),
  client: z.object({ id: z.string(), name: z.string() }),
  nextOccurrenceAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

const RecurringListResponseSchema = z.object({
  recurringBookings: z.array(RecurringListItemSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

const OccurrenceSchema = z.object({
  bookingId: z.string(),
  scheduledAt: z.string(),
  status: BookingStatus,
});

const RecurringDetailSchema = z.object({
  recurringBooking: RecurringListItemSchema.extend({
    services: z.array(z.object({
      id: z.string(),
      name: z.string(),
      durationMinutes: z.number(),
      bookingType: z.string(),
      startOffsetMinutes: z.number(),
      priceUsd: z.number(),
    })),
    totalDurationMinutes: z.number(),
    pastOccurrences: z.array(OccurrenceSchema),
    upcomingOccurrences: z.array(OccurrenceSchema),
    windowStartDate: z.string().nullable(),
    pauseStartDate: z.string().nullable(),
    pauseEndDate: z.string().nullable(),
    barberAcceptedAt: z.string().nullable(),
    barberDeclinedAt: z.string().nullable(),
    declinedReason: z.string().nullable(),
    cancelledAt: z.string().nullable(),
    cancelledBy: CancelledBy.nullable(),
  }),
});

const RecurringActionSchema = z.object({
  recurringBooking: RecurringListItemSchema.extend({
    cancelledAt: z.string().nullable().optional(),
    cancelledBy: CancelledBy.nullable().optional(),
    barberAcceptedAt: z.string().nullable().optional(),
    barberDeclinedAt: z.string().nullable().optional(),
    declinedReason: z.string().nullable().optional(),
    pauseStartDate: z.string().nullable().optional(),
    pauseEndDate: z.string().nullable().optional(),
  }),
});

// ---------- Public types ----------

export type RecurringListItem = z.infer<typeof RecurringListItemSchema>;
export type RecurringListPage = z.infer<typeof RecurringListResponseSchema>;
export type RecurringDetail = z.infer<typeof RecurringDetailSchema>;
export type RecurringAction = z.infer<typeof RecurringActionSchema>['recurringBooking'];

export interface ListRecurringParams {
  status?: z.infer<typeof RecurringStatus>;
  cursor?: string;
  limit?: number;
}

export interface PauseBody {
  pauseStartDate: string;
  pauseEndDate?: string;
}

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

export async function listRecurring(
  params: ListRecurringParams,
  opts: RequestOptions = {},
): Promise<RecurringListPage> {
  const { data: res } = await apiClient.get('/barber/recurring-bookings', {
    params,
    signal: opts.signal,
  });
  return RecurringListResponseSchema.parse(extractPayload(res));
}

export async function getRecurring(
  recurringId: string,
  opts: RequestOptions = {},
): Promise<RecurringDetail> {
  const { data: res } = await apiClient.get(
    `/barber/recurring-bookings/${recurringId}`,
    { signal: opts.signal },
  );
  return RecurringDetailSchema.parse(extractPayload(res));
}

export async function acceptRecurring(
  recurringId: string,
  opts: RequestOptions = {},
): Promise<RecurringAction> {
  const { data: res } = await apiClient.patch(
    `/barber/recurring-bookings/${recurringId}/accept`,
    undefined,
    { signal: opts.signal },
  );
  return RecurringActionSchema.parse(extractPayload(res)).recurringBooking;
}

export async function declineRecurring(
  recurringId: string,
  reason?: string,
  opts: RequestOptions = {},
): Promise<RecurringAction> {
  const { data: res } = await apiClient.patch(
    `/barber/recurring-bookings/${recurringId}/decline`,
    reason ? { reason } : undefined,
    { signal: opts.signal },
  );
  return RecurringActionSchema.parse(extractPayload(res)).recurringBooking;
}

export async function pauseRecurring(
  recurringId: string,
  body: PauseBody,
  opts: RequestOptions = {},
): Promise<RecurringAction> {
  const { data: res } = await apiClient.patch(
    `/barber/recurring-bookings/${recurringId}/pause`,
    body,
    { signal: opts.signal },
  );
  return RecurringActionSchema.parse(extractPayload(res)).recurringBooking;
}

export async function resumeRecurring(
  recurringId: string,
  opts: RequestOptions = {},
): Promise<RecurringAction> {
  const { data: res } = await apiClient.patch(
    `/barber/recurring-bookings/${recurringId}/resume`,
    undefined,
    { signal: opts.signal },
  );
  return RecurringActionSchema.parse(extractPayload(res)).recurringBooking;
}

export async function cancelRecurring(
  recurringId: string,
  opts: RequestOptions = {},
): Promise<RecurringAction> {
  const { data: res } = await apiClient.patch(
    `/barber/recurring-bookings/${recurringId}/cancel`,
    undefined,
    { signal: opts.signal },
  );
  return RecurringActionSchema.parse(extractPayload(res)).recurringBooking;
}
