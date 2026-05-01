import { z } from 'zod';
import { apiClient } from './client';

// ---------- Response schemas ----------

const NotificationSettingsSchema = z.object({
  normal_bookings: z.boolean(),
  recurring_bookings: z.boolean(),
});

// ---------- Public types ----------

export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;

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

export async function getNotificationSettings(
  opts: RequestOptions = {},
): Promise<NotificationSettings> {
  const { data: res } = await apiClient.get('/barber/notification-settings', {
    signal: opts.signal,
  });
  return NotificationSettingsSchema.parse(extractPayload(res));
}

export async function updateNotificationSettings(
  body: NotificationSettings,
  opts: RequestOptions = {},
): Promise<NotificationSettings> {
  const { data: res } = await apiClient.put(
    '/barber/notification-settings',
    body,
    { signal: opts.signal },
  );
  return NotificationSettingsSchema.parse(extractPayload(res));
}
