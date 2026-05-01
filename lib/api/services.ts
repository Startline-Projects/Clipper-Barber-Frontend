import { z } from 'zod';
import { apiClient } from './client';
import { useAuthStore } from '@/lib/stores/auth.store';
import { ServiceType, DurationMinutes } from '@/lib/schemas/enums';

// ---------- Response schemas ----------

const ServiceSchema = z.object({
  id: z.string(),
  barberId: z.string(),
  name: z.string(),
  serviceType: ServiceType,
  durationMinutes: z.number(),
  regularPriceUsd: z.number(),
  afterHoursPriceUsd: z.number().nullable(),
  dayOffPriceUsd: z.number().nullable(),
  recurringPriceUsd: z.number().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const ServiceListSchema = z.array(ServiceSchema);

// ---------- Public types ----------

export type Service = z.infer<typeof ServiceSchema>;

export interface CreateServiceBody {
  name: string;
  serviceType: z.infer<typeof ServiceType>;
  durationMinutes: z.infer<typeof DurationMinutes>;
  regularPriceUsd: number;
  afterHoursPriceUsd?: number;
  dayOffPriceUsd?: number;
  recurringPriceUsd?: number;
}

export interface UpdateServiceBody {
  name?: string;
  serviceType?: z.infer<typeof ServiceType>;
  durationMinutes?: z.infer<typeof DurationMinutes>;
  regularPriceUsd?: number;
  afterHoursPriceUsd?: number | null;
  dayOffPriceUsd?: number | null;
  recurringPriceUsd?: number | null;
  sortOrder?: number;
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

function getBarberId(): string {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// ---------- Endpoints ----------

export async function createService(
  body: CreateServiceBody,
  opts: RequestOptions = {},
): Promise<Service> {
  const { data: res } = await apiClient.post(
    `/barbers/${getBarberId()}/services`,
    body,
    { signal: opts.signal },
  );
  return ServiceSchema.parse(extractPayload(res));
}

export async function listServices(
  opts: RequestOptions = {},
): Promise<Service[]> {
  const { data: res } = await apiClient.get(
    `/barbers/${getBarberId()}/services`,
    { signal: opts.signal },
  );
  return ServiceListSchema.parse(extractPayload(res));
}

export async function getService(
  serviceId: string,
  opts: RequestOptions = {},
): Promise<Service> {
  const { data: res } = await apiClient.get(
    `/barbers/${getBarberId()}/services/${serviceId}`,
    { signal: opts.signal },
  );
  return ServiceSchema.parse(extractPayload(res));
}

export async function updateService(
  serviceId: string,
  body: UpdateServiceBody,
  opts: RequestOptions = {},
): Promise<Service> {
  const { data: res } = await apiClient.patch(
    `/barbers/${getBarberId()}/services/${serviceId}`,
    body,
    { signal: opts.signal },
  );
  return ServiceSchema.parse(extractPayload(res));
}

export async function toggleService(
  serviceId: string,
  opts: RequestOptions = {},
): Promise<Service> {
  const { data: res } = await apiClient.patch(
    `/barbers/${getBarberId()}/services/${serviceId}/toggle`,
    undefined,
    { signal: opts.signal },
  );
  return ServiceSchema.parse(extractPayload(res));
}

export async function reorderServices(
  serviceIds: string[],
  opts: RequestOptions = {},
): Promise<Service[]> {
  const { data: res } = await apiClient.patch(
    `/barbers/${getBarberId()}/services/reorder`,
    { serviceIds },
    { signal: opts.signal },
  );
  return ServiceListSchema.parse(extractPayload(res));
}
