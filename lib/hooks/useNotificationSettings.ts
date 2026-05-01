import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { queryKeys } from './queryKeys';
import * as nsApi from '@/lib/api/notification-settings';
import type { NotificationSettings } from '@/lib/api/notification-settings';

export function useNotificationSettings() {
  const hasTokens = useAuthStore((s) => Boolean(s.accessToken));
  return useQuery({
    queryKey: queryKeys.notificationSettings.detail(),
    queryFn: ({ signal }) => nsApi.getNotificationSettings({ signal }),
    enabled: hasTokens,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: nsApi.NotificationSettings) =>
      nsApi.updateNotificationSettings(body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: queryKeys.notificationSettings.all });
      const previous = qc.getQueryData<NotificationSettings>(
        queryKeys.notificationSettings.detail(),
      );
      qc.setQueryData(queryKeys.notificationSettings.detail(), body);
      return { previous };
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(queryKeys.notificationSettings.detail(), ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notificationSettings.all });
    },
  });
}
