import { z } from 'zod';
import { apiClient } from './client';

export type ArrangementFrequency =
  | 'weekly'
  | 'biweekly'
  | 'every_n_weeks'
  | 'monthly';

export type ArrangementEndType = 'none' | 'after_count' | 'on_date';

export type ArrangementBookingType = 'regular' | 'after_hours' | 'day_off';

export interface CreateArrangementBody {
  clientId: string;
  services: { barberServiceId: string; bookingType: ArrangementBookingType }[];
  dayOfWeek: number;
  timeOfDay: string; // HH:mm
  frequency: ArrangementFrequency;
  intervalN?: number;
  startDate: string; // YYYY-MM-DD
  endType: ArrangementEndType;
  endCount?: number;
  endDate?: string;
  noteToClient?: string;
}

const ArrangementSchema = z.object({
  id: z.string(),
  status: z.enum([
    'pending_client_approval',
    'active',
    'rejected',
    'cancelled',
    'ended',
  ]),
  dayOfWeek: z.number(),
  timeOfDay: z.string(),
  frequency: z.string(),
  startDate: z.string(),
  endType: z.string(),
  priceUsd: z.number(),
  totalDurationMinutes: z.number(),
  noChange: z.boolean().optional(),
});

const ArrangementResponseSchema = z.object({
  arrangement: ArrangementSchema.passthrough(),
});

export type RecurringArrangement = z.infer<typeof ArrangementSchema>;

export interface ArrangementConflict {
  scheduledAt: string;
  conflictingBookingId: string | null;
  reason: 'one_off_booking' | 'recurring_booking' | 'recurring_arrangement';
}

export async function createArrangement(
  body: CreateArrangementBody,
): Promise<RecurringArrangement> {
  const { data } = await apiClient.post('/barber/recurring-arrangements', body);
  return ArrangementResponseSchema.parse(data).arrangement as RecurringArrangement;
}
