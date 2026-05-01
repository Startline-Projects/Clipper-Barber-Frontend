import { z } from 'zod';
import { apiClient } from './client';
import { RecurringFrequencyOption, DurationMinutes } from '@/lib/schemas/enums';

// ---------- Response schemas ----------

const ScheduleDaySchema = z.object({
  id: z.string(),
  barberId: z.string(),
  dayOfWeek: z.number(),
  isWorking: z.boolean(),
  regularStartTime: z.string().nullable(),
  regularEndTime: z.string().nullable(),
  slotDurationMinutes: z.number(),
  afterHoursEnabled: z.boolean(),
  afterHoursStart: z.string().nullable(),
  afterHoursEnd: z.string().nullable(),
  dayOffBookingEnabled: z.boolean(),
  dayOffStartTime: z.string().nullable(),
  dayOffEndTime: z.string().nullable(),
  advanceNoticeMinutes: z.number(),
  recurringEnabled: z.boolean(),
  recurringFrequency: RecurringFrequencyOption.nullable(),
  recurringExtraChargeUsd: z.number().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const ScheduleListSchema = z.array(ScheduleDaySchema);

// ---------- Public types ----------

export type ScheduleDay = z.infer<typeof ScheduleDaySchema>;
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export interface Schedule {
  days: ScheduleDay[];
}

export interface UpdateScheduleDayBody {
  isWorking?: boolean;
  regularStartTime?: string;
  regularEndTime?: string;
  slotDurationMinutes?: z.infer<typeof DurationMinutes>;
  afterHoursEnabled?: boolean;
  afterHoursStart?: string;
  afterHoursEnd?: string;
  dayOffBookingEnabled?: boolean;
  dayOffStartTime?: string;
  dayOffEndTime?: string;
  advanceNoticeMinutes?: number;
  recurringEnabled?: boolean;
  recurringFrequency?: z.infer<typeof RecurringFrequencyOption>;
  recurringExtraChargeUsd?: number;
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

export async function getSchedule(
  opts: RequestOptions = {},
): Promise<Schedule> {
  const { data: res } = await apiClient.get('/schedule', {
    signal: opts.signal,
  });
  return { days: ScheduleListSchema.parse(extractPayload(res)) };
}

export async function updateScheduleDay(
  dayOfWeek: number,
  body: UpdateScheduleDayBody,
  opts: RequestOptions = {},
): Promise<ScheduleDay> {
  const { data: res } = await apiClient.patch(
    `/schedule/${dayOfWeek}`,
    body,
    { signal: opts.signal },
  );
  return ScheduleDaySchema.parse(extractPayload(res));
}
