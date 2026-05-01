import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/lib/utils/supabase-client';
import { queryKeys } from './queryKeys';
import { useAuthStore } from '@/lib/stores/auth.store';

const RealtimeInsertSchema = z.object({
  conversation_id: z.string(),
  sender_role: z.enum(['barber', 'client']),
});

export function useRealtimeUnread() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('global-unread')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const parsed = RealtimeInsertSchema.safeParse(payload.new);
          if (!parsed.success) return;

          if (parsed.data.sender_role !== 'client') return;

          qc.invalidateQueries({ queryKey: queryKeys.conversations.lists() });
          qc.invalidateQueries({
            queryKey: queryKeys.notifications.unreadCount(),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);
}
