import { z } from 'zod';
import { apiClient } from './client';

// ---------- Response schemas ----------

const AutoConfirmSchema = z.object({
  allowAutoConfirm: z.boolean(),
  autoConfirmToday: z.boolean(),
});

const RecurringSettingSchema = z.object({
  recurringEnabled: z.boolean(),
});

const NoShowChargeSchema = z.object({
  enabled: z.boolean(),
  amountUsd: z.number().nullable(),
});

const InHouseServicesSchema = z.object({
  inHouseServices: z.boolean(),
});

// ---------- Public types ----------

export type AutoConfirmSettings = z.infer<typeof AutoConfirmSchema>;
export type RecurringSetting = z.infer<typeof RecurringSettingSchema>;
export type NoShowChargeSetting = z.infer<typeof NoShowChargeSchema>;
export type InHouseServicesSetting = z.infer<typeof InHouseServicesSchema>;

export interface NoShowChargeBody {
  enabled: boolean;
  amountUsd?: number;
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

export async function toggleAutoConfirm(
  enabled: boolean,
  opts: RequestOptions = {},
): Promise<AutoConfirmSettings> {
  const { data: res } = await apiClient.patch(
    '/barber/settings/auto-confirm',
    { enabled },
    { signal: opts.signal },
  );
  return AutoConfirmSchema.parse(extractPayload(res));
}

export async function toggleAutoConfirmToday(
  enabled: boolean,
  opts: RequestOptions = {},
): Promise<AutoConfirmSettings> {
  const { data: res } = await apiClient.patch(
    '/barber/settings/auto-confirm-today',
    { enabled },
    { signal: opts.signal },
  );
  return AutoConfirmSchema.parse(extractPayload(res));
}

export async function toggleRecurring(
  enabled: boolean,
  opts: RequestOptions = {},
): Promise<RecurringSetting> {
  const { data: res } = await apiClient.patch(
    '/barber/settings/recurring',
    { enabled },
    { signal: opts.signal },
  );
  return RecurringSettingSchema.parse(extractPayload(res));
}

export async function toggleInHouseServices(
  enabled: boolean,
  opts: RequestOptions = {},
): Promise<InHouseServicesSetting> {
  const { data: res } = await apiClient.patch(
    '/barber/settings/in-house-services',
    { enabled },
    { signal: opts.signal },
  );
  return InHouseServicesSchema.parse(extractPayload(res));
}

export async function updateNoShowCharge(
  body: NoShowChargeBody,
  opts: RequestOptions = {},
): Promise<NoShowChargeSetting> {
  const { data: res } = await apiClient.patch(
    '/barber/settings/no-show-charge',
    body,
    { signal: opts.signal },
  );
  return NoShowChargeSchema.parse(extractPayload(res));
}
