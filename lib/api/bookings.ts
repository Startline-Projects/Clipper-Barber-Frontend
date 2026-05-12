import { z } from 'zod';
import { apiClient } from './client';
import {
  BookingType,
  BookingStatus,
  BookingTimeframe,
  BookingTypeFilter,
  CancelledBy,
} from '@/lib/schemas/enums';

// ---------- Response schemas ----------

// Per multi-service rollout: a booking can carry up to 4 services. New
// `services[]` and `totalDurationMinutes` ship on every barber booking
// response. Legacy `service.durationMinutes` now means TOTAL BLOCK,
// not the primary service's nominal duration. All fields are optional
// here so pre-rollout responses still validate.
const BookingServiceItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  durationMinutes: z.number(), // NOMINAL service duration
  bookingType: BookingType,
  startOffsetMinutes: z.number(),
});

const BookingTimeFieldsSchema = {
  timezone: z.string().optional().nullable(),
  appointmentDate: z.string().optional().nullable(),
  appointmentTime: z.string().optional().nullable(),
};

const BookingListItemSchema = z.object({
  id: z.string(),
  client: z.object({
    id: z.string(),
    name: z.string(),
    profilePhotoUrl: z.string().nullable(),
  }),
  service: z.object({
    name: z.string(),
    durationMinutes: z.number(), // now TOTAL BLOCK duration
  }),
  services: z.array(BookingServiceItemSchema).optional(),
  totalDurationMinutes: z.number().optional(),
  scheduledAt: z.string(),
  ...BookingTimeFieldsSchema,
  bookingType: BookingType,
  totalPrice: z.number(),
  status: BookingStatus,
  isRecurring: z.boolean(),
  recurringBookingId: z.string().nullable(),
  createdAt: z.string(),
});

const BookingListResponseSchema = z.object({
  bookings: z.array(BookingListItemSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

const BookingDetailSchema = z.object({
  booking: z.object({
    id: z.string(),
    client: z.object({
      id: z.string(),
      name: z.string(),
      profilePhotoUrl: z.string().nullable(),
    }),
    service: z.object({
      name: z.string(),
      durationMinutes: z.number(), // total block duration
    }),
    services: z.array(BookingServiceItemSchema).optional(),
    totalDurationMinutes: z.number().optional(),
    scheduledAt: z.string(),
    ...BookingTimeFieldsSchema,
    bookingType: BookingType,
    status: BookingStatus,
    pricing: z.object({
      basePrice: z.number(),
      additionalCost: z.number(),
      totalPrice: z.number(),
    }),
    confirmedAt: z.string().nullable(),
    cancelledAt: z.string().nullable(),
    cancelledBy: CancelledBy.nullable(),
    noShowCharged: z.boolean(),
    noShowChargeAmountUsd: z.number().nullable(),
    reviewLeftByClient: z.boolean(),
    isRecurring: z.boolean(),
    recurringBookingId: z.string().nullable(),
    createdAt: z.string(),
  }),
});

const BookingActionSchema = z.object({
  booking: z.object({
    id: z.string(),
    status: BookingStatus,
    confirmedAt: z.string().optional(),
    cancelledAt: z.string().optional(),
    cancelledBy: CancelledBy.optional(),
  }),
});

// ---------- Public types ----------

export type BookingServiceItem = z.infer<typeof BookingServiceItemSchema>;
export type BookingListItem = z.infer<typeof BookingListItemSchema>;
export type BookingsListPage = z.infer<typeof BookingListResponseSchema>;
export type BookingDetail = z.infer<typeof BookingDetailSchema>;
export type BookingAction = z.infer<typeof BookingActionSchema>['booking'];

export interface ListBookingsParams {
  timeframe: z.infer<typeof BookingTimeframe>;
  bookingType?: z.infer<typeof BookingType>;
  status?: z.infer<typeof BookingStatus>;
  type?: z.infer<typeof BookingTypeFilter>;
  cursor?: string;
  limit?: number;
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

export async function listBookings(
  params: ListBookingsParams,
  opts: RequestOptions = {},
): Promise<BookingsListPage> {
  const { data: res } = await apiClient.get('/barber/bookings', {
    params,
    signal: opts.signal,
  });
  return BookingListResponseSchema.parse(extractPayload(res));
}

export async function getBooking(
  bookingId: string,
  opts: RequestOptions = {},
): Promise<BookingDetail> {
  const { data: res } = await apiClient.get(`/barber/bookings/${bookingId}`, {
    signal: opts.signal,
  });
  return BookingDetailSchema.parse(extractPayload(res));
}

export async function confirmBooking(
  bookingId: string,
  opts: RequestOptions = {},
): Promise<BookingAction> {
  const { data: res } = await apiClient.patch(
    `/barber/bookings/${bookingId}/confirm`,
    undefined,
    { signal: opts.signal },
  );
  return BookingActionSchema.parse(extractPayload(res)).booking;
}

export async function cancelBooking(
  bookingId: string,
  opts: RequestOptions = {},
): Promise<BookingAction> {
  const { data: res } = await apiClient.patch(
    `/barber/bookings/${bookingId}/cancel`,
    undefined,
    { signal: opts.signal },
  );
  return BookingActionSchema.parse(extractPayload(res)).booking;
}

export async function completeBooking(
  bookingId: string,
  opts: RequestOptions = {},
): Promise<BookingAction> {
  const { data: res } = await apiClient.patch(
    `/barber/bookings/${bookingId}/complete`,
    undefined,
    { signal: opts.signal },
  );
  return BookingActionSchema.parse(extractPayload(res)).booking;
}

export async function noShowBooking(
  bookingId: string,
  opts: RequestOptions = {},
): Promise<BookingAction> {
  const { data: res } = await apiClient.patch(
    `/barber/bookings/${bookingId}/no-show`,
    undefined,
    { signal: opts.signal },
  );
  return BookingActionSchema.parse(extractPayload(res)).booking;
}
