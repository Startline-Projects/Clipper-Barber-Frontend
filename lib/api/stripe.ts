import { z } from 'zod';
import { apiClient } from './client';

// ---------- Response schemas ----------

const OnboardResponseSchema = z.object({
  onboardingUrl: z.string(),
});

const ConnectStatusSchema = z.object({
  connected: z.boolean(),
  chargesEnabled: z.boolean(),
  payoutsEnabled: z.boolean(),
  requirementsCurrentlyDue: z.array(z.string()),
});

const DisconnectResponseSchema = z.object({
  disconnected: z.literal(true),
});

// ---------- Public types ----------

export type ConnectStatus = z.infer<typeof ConnectStatusSchema>;

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

export async function onboardConnect(
  opts: RequestOptions = {},
): Promise<string> {
  const { data: res } = await apiClient.post(
    '/barbers/me/connect/onboard',
    undefined,
    { signal: opts.signal },
  );
  return OnboardResponseSchema.parse(extractPayload(res)).onboardingUrl;
}

export async function getConnectStatus(
  opts: RequestOptions = {},
): Promise<ConnectStatus> {
  const { data: res } = await apiClient.get('/barbers/me/connect/status', {
    signal: opts.signal,
  });
  return ConnectStatusSchema.parse(extractPayload(res));
}

export async function disconnectConnect(
  opts: RequestOptions = {},
): Promise<void> {
  const { data: res } = await apiClient.delete('/barbers/me/connect', {
    signal: opts.signal,
  });
  DisconnectResponseSchema.parse(extractPayload(res));
}
