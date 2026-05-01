import { z } from 'zod';
import { apiClient } from './client';
import { SenderRole } from '@/lib/schemas/enums';

// ---------- Response schemas ----------

const ConversationSchema = z.object({
  id: z.string(),
  otherParty: z.object({
    id: z.string(),
    name: z.string(),
    profilePhotoUrl: z.string().nullable(),
  }),
  lastMessageBody: z.string().nullable(),
  lastMessageAt: z.string().nullable(),
  lastMessageSenderRole: SenderRole.nullable(),
  unreadCount: z.number(),
  hasBooking: z.boolean(),
  createdAt: z.string(),
});

const ConversationListResponseSchema = z.object({
  conversations: z.array(ConversationSchema),
  pagination: z.object({
    currentPage: z.number(),
    totalPages: z.number(),
    totalConversations: z.number(),
    limit: z.number(),
    hasNextPage: z.boolean(),
  }),
});

const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderRole: SenderRole,
  body: z.string(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});

const MessagesListResponseSchema = z.object({
  messages: z.array(MessageSchema),
  hasMore: z.boolean(),
  nextCursor: z.string().nullable(),
});

const SendMessageResponseSchema = z.object({
  message: MessageSchema,
});

const StartConversationResponseSchema = z.object({
  conversation: ConversationSchema,
});

// ---------- Public types ----------

export type Conversation = z.infer<typeof ConversationSchema>;
export type ConversationListResponse = z.infer<typeof ConversationListResponseSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type MessagesListResponse = z.infer<typeof MessagesListResponseSchema>;

export interface ListConversationsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListMessagesParams {
  before?: string;
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

export async function listConversations(
  params: ListConversationsParams = {},
  opts: RequestOptions = {},
): Promise<ConversationListResponse> {
  const { data: res } = await apiClient.get('/conversations', {
    params,
    signal: opts.signal,
  });
  return ConversationListResponseSchema.parse(extractPayload(res));
}

export async function listMessages(
  conversationId: string,
  params: ListMessagesParams = {},
  opts: RequestOptions = {},
): Promise<MessagesListResponse> {
  const { data: res } = await apiClient.get(
    `/conversations/${conversationId}/messages`,
    { params, signal: opts.signal },
  );
  return MessagesListResponseSchema.parse(extractPayload(res));
}

export async function sendMessage(
  conversationId: string,
  body: string,
  opts: RequestOptions = {},
): Promise<Message> {
  const { data: res } = await apiClient.post(
    `/conversations/${conversationId}/messages`,
    { body },
    { signal: opts.signal },
  );
  return SendMessageResponseSchema.parse(extractPayload(res)).message;
}

export async function startConversation(
  clientId: string,
  opts: RequestOptions = {},
): Promise<Conversation> {
  const { data: res } = await apiClient.post(
    '/conversations/start',
    { clientId },
    { signal: opts.signal },
  );
  return StartConversationResponseSchema.parse(extractPayload(res)).conversation;
}
