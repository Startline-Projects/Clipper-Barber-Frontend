import { z } from 'zod';
import { apiClient } from './client';
import { BookingType, BookingStatus, BarberCategoryTag } from '@/lib/schemas/enums';

const ClientSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  profilePhotoUrl: z.string().nullable(),
});

const BookingServiceItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  durationMinutes: z.number(),
  bookingType: BookingType,
});

const PendingItemSchema = z.object({
  bookingId: z.string(),
  client: ClientSchema,
  service: z.object({ id: z.string(), name: z.string() }).nullable(),
  services: z.array(BookingServiceItemSchema),
  scheduledAt: z.string(),
  timezone: z.string(),
  appointmentDate: z.string(),
  appointmentTime: z.string(),
  priceUsd: z.number(),
  status: BookingStatus,
  requestedAt: z.string(),
});

const ScheduleItemSchema = z.object({
  bookingId: z.string(),
  client: ClientSchema,
  service: z
    .object({ id: z.string(), name: z.string(), durationMinutes: z.number() })
    .nullable(),
  services: z.array(BookingServiceItemSchema),
  totalDurationMinutes: z.number(),
  scheduledAt: z.string(),
  timezone: z.string(),
  appointmentDate: z.string(),
  appointmentTime: z.string(),
  endAt: z.string(),
  minutesUntilStart: z.number(),
  priceUsd: z.number(),
  status: BookingStatus,
});

export const BarberHomeResponseSchema = z.object({
  today: z.object({
    date: z.string(),
    timezone: z.string(),
    totalAppointments: z.number(),
    completedCount: z.number(),
    remainingCount: z.number(),
    earningsSoFarUsd: z.number(),
  }),
  pendingApproval: z.object({
    totalCount: z.number(),
    items: z.array(PendingItemSchema),
  }),
  schedule: z.object({
    totalUpcomingToday: z.number(),
    items: z.array(ScheduleItemSchema),
  }),
  allowAutoConfirm: z.boolean(),
  autoConfirmToday: z.boolean(),
  recurringEnabled: z.boolean(),
  noShowChargeEnabled: z.boolean(),
  noShowChargeAmountUsd: z.number().nullable(),
  stripeConnected: z.boolean(),
  locationSet: z.boolean(),
  categories: z.array(BarberCategoryTag),
});

export type BarberHomeResponse = z.infer<typeof BarberHomeResponseSchema>;
export type BarberHomePendingItem = z.infer<typeof PendingItemSchema>;
export type BarberHomeScheduleItem = z.infer<typeof ScheduleItemSchema>;
export type BarberHomeBookingServiceItem = z.infer<typeof BookingServiceItemSchema>;

export async function getBarberHome(signal?: AbortSignal): Promise<BarberHomeResponse> {
  const { data } = await apiClient.get('/barber/home', { signal });
  return BarberHomeResponseSchema.parse(data);
}
