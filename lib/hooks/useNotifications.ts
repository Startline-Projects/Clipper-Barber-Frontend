import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { queryKeys, type NotificationsFilters } from './queryKeys';
import { invalidations } from './invalidations';
import * as notifApi from '@/lib/api/notifications';
import type { NotificationsListPage } from '@/lib/api/notifications';

export function useNotifications(filters: NotificationsFilters = {}) {
  const hasTokens = useAuthStore((s) => Boolean(s.accessToken));
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: ({ pageParam, signal }) =>
      notifApi.listNotifications({ page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNextPage
        ? last.pagination.currentPage + 1
        : undefined,
    enabled: hasTokens,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useUnreadCount() {
  const hasTokens = useAuthStore((s) => Boolean(s.accessToken));
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: ({ signal }) => notifApi.getUnreadCount({ signal }),
    enabled: hasTokens,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notifApi.markNotificationRead(id),
    onMutate: async (notificationId) => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.lists() });
      await qc.cancelQueries({
        queryKey: queryKeys.notifications.unreadCount(),
      });

      // Optimistically flip isRead in all cached notification pages
      const previousPages = new Map<
        string,
        InfiniteData<NotificationsListPage> | undefined
      >();
      let wasUnread = false;

      qc.getQueriesData<InfiniteData<NotificationsListPage>>({
        queryKey: queryKeys.notifications.lists(),
      }).forEach(([key, data]) => {
        previousPages.set(JSON.stringify(key), data);
        if (!data) return;

        qc.setQueryData<InfiniteData<NotificationsListPage>>(key, {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((n) => {
              if (n.id === notificationId) {
                if (!n.isRead) wasUnread = true;
                return { ...n, isRead: true };
              }
              return n;
            }),
          })),
        });
      });

      // Optimistically decrement unread count
      const previousCount = qc.getQueryData<number>(
        queryKeys.notifications.unreadCount(),
      );
      if (wasUnread && previousCount !== undefined && previousCount > 0) {
        qc.setQueryData(
          queryKeys.notifications.unreadCount(),
          previousCount - 1,
        );
      }

      return { previousPages, previousCount };
    },
    onError: (_err, _notificationId, ctx) => {
      if (ctx?.previousPages) {
        ctx.previousPages.forEach((data, keyStr) => {
          qc.setQueryData(JSON.parse(keyStr), data);
        });
      }
      if (ctx?.previousCount !== undefined) {
        qc.setQueryData(
          queryKeys.notifications.unreadCount(),
          ctx.previousCount,
        );
      }
    },
    onSettled: () => invalidations.notificationRead(qc),
  });
}

export function useClearAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notifApi.clearAllNotifications(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.lists() });
      await qc.cancelQueries({
        queryKey: queryKeys.notifications.unreadCount(),
      });

      const previousPages = new Map<
        string,
        InfiniteData<NotificationsListPage> | undefined
      >();

      qc.getQueriesData<InfiniteData<NotificationsListPage>>({
        queryKey: queryKeys.notifications.lists(),
      }).forEach(([key, data]) => {
        previousPages.set(JSON.stringify(key), data);
        if (!data) return;

        qc.setQueryData<InfiniteData<NotificationsListPage>>(key, {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((n) =>
              n.isRead ? n : { ...n, isRead: true },
            ),
          })),
        });
      });

      const previousCount = qc.getQueryData<number>(
        queryKeys.notifications.unreadCount(),
      );
      qc.setQueryData(queryKeys.notifications.unreadCount(), 0);

      return { previousPages, previousCount };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousPages) {
        ctx.previousPages.forEach((data, keyStr) => {
          qc.setQueryData(JSON.parse(keyStr), data);
        });
      }
      if (ctx?.previousCount !== undefined) {
        qc.setQueryData(
          queryKeys.notifications.unreadCount(),
          ctx.previousCount,
        );
      }
    },
    onSettled: () => invalidations.notificationRead(qc),
  });
}
