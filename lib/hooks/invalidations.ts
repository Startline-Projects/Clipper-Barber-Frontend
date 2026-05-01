import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export const invalidations = {
  bookingMutated: (qc: QueryClient, bookingId: string) => {
    qc.invalidateQueries({ queryKey: queryKeys.bookings.lists() });
    qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
    qc.invalidateQueries({ queryKey: queryKeys.analytics.all });
    qc.invalidateQueries({ queryKey: queryKeys.clients.all });
  },

  recurringMutated: (qc: QueryClient, recurringId: string) => {
    qc.invalidateQueries({ queryKey: queryKeys.recurring.lists() });
    qc.invalidateQueries({ queryKey: queryKeys.recurring.detail(recurringId) });
    qc.invalidateQueries({ queryKey: queryKeys.bookings.lists() });
    qc.invalidateQueries({ queryKey: queryKeys.analytics.all });
  },

  serviceListMutated: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: queryKeys.services.all });
  },

  serviceUpdated: (qc: QueryClient, serviceId: string) => {
    qc.invalidateQueries({ queryKey: queryKeys.services.lists() });
    qc.invalidateQueries({ queryKey: queryKeys.services.detail(serviceId) });
  },

  profileUpdated: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: queryKeys.profile.all });
  },

  messageReceived: (qc: QueryClient, conversationId: string) => {
    qc.invalidateQueries({ queryKey: queryKeys.messages.list(conversationId) });
    qc.invalidateQueries({ queryKey: queryKeys.conversations.lists() });
    qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
  },

  messageSent: (qc: QueryClient, conversationId: string) => {
    qc.invalidateQueries({ queryKey: queryKeys.messages.list(conversationId) });
    qc.invalidateQueries({ queryKey: queryKeys.conversations.lists() });
  },

  notificationRead: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
    qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
  },

  scheduleUpdated: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: queryKeys.schedule.all });
  },

  settingsChanged: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: queryKeys.settings.all });
  },

  stripeStatusChanged: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: queryKeys.stripe.all });
    qc.invalidateQueries({ queryKey: queryKeys.settings.all });
  },

  onLogout: (qc: QueryClient) => qc.clear(),
};
