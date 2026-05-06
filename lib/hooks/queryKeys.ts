import type { z } from 'zod';
import type {
  BookingTimeframe,
  BookingType,
  BookingStatus,
  BookingTypeFilter,
  RecurringStatus,
  AnalyticsPeriod,
  ClientSortBy,
  SortOrder,
} from '@/lib/schemas/enums';

// ---------- Typed filter shapes ----------

export interface BookingsFilters {
  timeframe: z.infer<typeof BookingTimeframe>;
  bookingType?: z.infer<typeof BookingType>;
  status?: z.infer<typeof BookingStatus>;
  type?: z.infer<typeof BookingTypeFilter>;
}

export interface RecurringFilters {
  status?: z.infer<typeof RecurringStatus>;
}

export interface ReviewsFilters {
  rating?: number;
}

export interface ConversationsFilters {
  search?: string;
}

export interface NotificationsFilters {
  unreadOnly?: boolean;
}

export interface ClientsFilters {
  search?: string;
  sortBy?: z.infer<typeof ClientSortBy>;
  order?: z.infer<typeof SortOrder>;
  hasUpcoming?: boolean;
}

type Period = z.infer<typeof AnalyticsPeriod>;

// ---------- Keys ----------

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    session: () => ['auth', 'session'] as const,
  },

  profile: {
    all: ['profile'] as const,
    me: () => ['profile', 'me'] as const,
  },

  schedule: {
    all: ['schedule'] as const,
    weekly: () => ['schedule', 'weekly'] as const,
  },

  settings: {
    all: ['settings'] as const,
    business: () => ['settings', 'business'] as const,
  },

  notificationSettings: {
    all: ['notificationSettings'] as const,
    detail: () => ['notificationSettings', 'detail'] as const,
  },

  stripe: {
    all: ['stripe'] as const,
    account: () => ['stripe', 'account'] as const,
    balance: () => ['stripe', 'balance'] as const,
    payouts: () => ['stripe', 'payouts'] as const,
  },

  services: {
    all: ['services'] as const,
    lists: () => [...queryKeys.services.all, 'list'] as const,
    list: () => [...queryKeys.services.lists()] as const,
    details: () => [...queryKeys.services.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.services.details(), id] as const,
  },

  bookings: {
    all: ['bookings'] as const,
    lists: () => [...queryKeys.bookings.all, 'list'] as const,
    list: (filters: BookingsFilters) =>
      [...queryKeys.bookings.lists(), filters] as const,
    details: () => [...queryKeys.bookings.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.bookings.details(), id] as const,
  },

  recurring: {
    all: ['recurring'] as const,
    lists: () => [...queryKeys.recurring.all, 'list'] as const,
    list: (filters: RecurringFilters) =>
      [...queryKeys.recurring.lists(), filters] as const,
    details: () => [...queryKeys.recurring.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.recurring.details(), id] as const,
    slots: (serviceIds: string[], dayOfWeek: number) =>
      [...queryKeys.recurring.all, 'slots', [...serviceIds].sort().join(','), dayOfWeek] as const,
  },

  reviews: {
    all: ['reviews'] as const,
    lists: () => [...queryKeys.reviews.all, 'list'] as const,
    list: (filters: ReviewsFilters) =>
      [...queryKeys.reviews.lists(), filters] as const,
    details: () => [...queryKeys.reviews.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reviews.details(), id] as const,
    summary: () => [...queryKeys.reviews.all, 'summary'] as const,
  },

  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
    list: (filters: ConversationsFilters) =>
      [...queryKeys.conversations.lists(), filters] as const,
    details: () => [...queryKeys.conversations.all, 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.conversations.details(), id] as const,
  },

  messages: {
    all: ['messages'] as const,
    byConversation: (conversationId: string) =>
      [...queryKeys.messages.all, 'conversation', conversationId] as const,
    list: (conversationId: string) =>
      [...queryKeys.messages.byConversation(conversationId), 'list'] as const,
  },

  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters: NotificationsFilters) =>
      [...queryKeys.notifications.lists(), filters] as const,
    unreadCount: () =>
      [...queryKeys.notifications.all, 'unreadCount'] as const,
  },

  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters: ClientsFilters) =>
      [...queryKeys.clients.lists(), filters] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
  },

  analytics: {
    all: ['analytics'] as const,
    revenue: (period: Period) =>
      [...queryKeys.analytics.all, 'revenue', period] as const,
    bookings: (period: Period) =>
      [...queryKeys.analytics.all, 'bookings', period] as const,
    clients: (period: Period) =>
      [...queryKeys.analytics.all, 'clients', period] as const,
    services: (period: Period) =>
      [...queryKeys.analytics.all, 'services', period] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
