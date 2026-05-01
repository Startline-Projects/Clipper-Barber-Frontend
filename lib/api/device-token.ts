import { z } from 'zod';
import { apiClient } from './client';
import { DevicePlatform } from '@/lib/schemas/enums';

// ---------- Response schemas ----------

const RegisterResponseSchema = z.object({
  id: z.string(),
  token: z.string(),
  platform: DevicePlatform,
});

const RemoveResponseSchema = z.object({
  removed: z.literal(true),
});

// ---------- Public types ----------

export interface RegisterTokenBody {
  token: string;
  platform: z.infer<typeof DevicePlatform>;
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

export async function registerDeviceToken(
  body: RegisterTokenBody,
  opts: RequestOptions = {},
): Promise<void> {
  const { data: res } = await apiClient.post('/device-token', body, {
    signal: opts.signal,
  });
  RegisterResponseSchema.parse(extractPayload(res));
}

export async function removeDeviceToken(
  token: string,
  opts: RequestOptions = {},
): Promise<void> {
  const { data: res } = await apiClient.delete('/device-token', {
    data: { token },
    signal: opts.signal,
  });
  RemoveResponseSchema.parse(extractPayload(res));
}
