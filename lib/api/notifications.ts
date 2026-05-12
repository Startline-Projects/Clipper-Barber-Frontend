import { z } from 'zod';
import { apiClient } from './client';
import { NotificationType } from '@/lib/schemas/enums';

// ---------- Response schemas ----------

const NotificationSchema = z.object({
  id: z.string(),
  type: NotificationType,
  title: z.string(),
  body: z.string(),
  data: z.record(z.string(), z.unknown()),
  isRead: z.boolean(),
  bookingId: z.string().nullable(),
  recurringBookingId: z.string().nullable(),
  conversationId: z.string().nullable(),
  messageId: z.string().nullable(),
  createdAt: z.string(),
});

const NotificationListResponseSchema = z.object({
  notifications: z.array(NotificationSchema),
  pagination: z.object({
    currentPage: z.number(),
    totalPages: z.number(),
    totalNotifications: z.number(),
    limit: z.number(),
    hasNextPage: z.boolean(),
  }),
});

const UnreadCountSchema = z.object({
  unreadCount: z.number(),
});

const MarkReadSchema = z.object({
  id: z.string(),
  isRead: z.literal(true),
});

const ClearAllSchema = z.object({
  updated: z.number(),
});

// ---------- Public types ----------

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationsListPage = z.infer<typeof NotificationListResponseSchema>;

export interface ListNotificationsParams {
  page?: number;
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

export async function listNotifications(
  params: ListNotificationsParams = {},
  opts: RequestOptions = {},
): Promise<NotificationsListPage> {
  const { data: res } = await apiClient.get('/barber/notifications', {
    params,
    signal: opts.signal,
  });
  return NotificationListResponseSchema.parse(extractPayload(res));
}

export async function getUnreadCount(
  opts: RequestOptions = {},
): Promise<number> {
  const { data: res } = await apiClient.get('/barber/notifications/unread-count', {
    signal: opts.signal,
  });
  return UnreadCountSchema.parse(extractPayload(res)).unreadCount;
}

export async function markNotificationRead(
  notificationId: string,
  opts: RequestOptions = {},
): Promise<void> {
  const { data: res } = await apiClient.put(
    `/barber/notifications/${notificationId}/read`,
    undefined,
    { signal: opts.signal },
  );
  MarkReadSchema.parse(extractPayload(res));
}

export async function clearAllNotifications(
  opts: RequestOptions = {},
): Promise<number> {
  const { data: res } = await apiClient.post(
    '/barber/notifications/clear-all',
    undefined,
    { signal: opts.signal },
  );
  return ClearAllSchema.parse(extractPayload(res)).updated;
}
