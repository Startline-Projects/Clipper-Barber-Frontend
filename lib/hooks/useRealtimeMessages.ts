import { useEffect } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/lib/utils/supabase-client';
import { queryKeys } from './queryKeys';
import { invalidations } from './invalidations';
import { SenderRole } from '@/lib/schemas/enums';
import type { Message, MessagesListResponse } from '@/lib/api/conversations';

// Realtime payload uses DB snake_case columns
const RealtimeMessageSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  sender_role: SenderRole,
  body: z.string(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});

function toMessage(row: z.infer<typeof RealtimeMessageSchema>): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderRole: row.sender_role,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export function useRealtimeMessages(conversationId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const parsed = RealtimeMessageSchema.safeParse(payload.new);
          if (!parsed.success) return;

          const message = toMessage(parsed.data);

          // Barber's own messages already in cache via optimistic insert
          if (message.senderRole === 'barber') return;

          qc.setQueryData<InfiniteData<MessagesListResponse>>(
            queryKeys.messages.list(conversationId),
            (old) => {
              if (!old) return old;

              // Deduplicate — check if message already exists in any page
              const exists = old.pages.some((p) =>
                p.messages.some((m) => m.id === message.id),
              );
              if (exists) return old;

              const pages = [...old.pages];
              const lastIdx = pages.length - 1;
              pages[lastIdx] = {
                ...pages[lastIdx],
                messages: [...pages[lastIdx].messages, message],
              };
              return { ...old, pages };
            },
          );

          invalidations.messageReceived(qc, conversationId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);
}
