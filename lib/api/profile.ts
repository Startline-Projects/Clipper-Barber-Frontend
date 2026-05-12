import { z } from 'zod';
import { apiClient } from './client';
import type { RNFile } from './auth';

// ---------- Response schemas ----------

// Profile DTO uses snake_case (API surfaces the DB row directly).
// Settings fields are patched onto the cache by useSettings mutations.
const ProfileSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  shop_name: z.string().nullable(),
  phone: z.string().nullable(),
  street_address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip_code: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  bio: z.string().nullable(),
  instagram_handle: z.string().nullable(),
  profile_photo_url: z.string().nullable(),
  onboarding_step: z.number(),
  onboarding_complete: z.boolean(),
  created_at: z.string(),
  // Settings — not in the profile GET response, but patched into cache
  // by settings mutations so the UI reads from one source.
  allowAutoConfirm: z.boolean().optional(),
  autoConfirmToday: z.boolean().optional(),
  recurringEnabled: z.boolean().optional(),
  noShowChargeEnabled: z.boolean().optional(),
  noShowChargeAmountUsd: z.number().nullable().optional(),
  inHouseServices: z.boolean().optional(),
  stripeConnected: z.boolean().optional(),
  locationSet: z.boolean().optional(),
});

// ---------- Public types ----------

export type BarberProfile = z.infer<typeof ProfileSchema>;
/** @deprecated Use BarberProfile */
export type Profile = BarberProfile;

export interface UpdateProfileBody {
  photo?: RNFile;
  fullName?: string;
  shopName?: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  bio?: string;
  instagramHandle?: string;
}

interface RequestOptions {
  signal?: AbortSignal;
}

// ---------- Helpers ----------

function appendRNFile(form: FormData, key: string, file: RNFile): void {
  form.append(key, file as unknown as Blob);
}

function extractPayload<T>(res: unknown): T {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

// ---------- Endpoints ----------

export async function getProfile(
  opts: RequestOptions = {},
): Promise<BarberProfile> {
  const { data: res } = await apiClient.get('/barber/profile', {
    signal: opts.signal,
  });
  return ProfileSchema.parse(extractPayload(res));
}

export async function updateProfile(
  body: UpdateProfileBody,
  opts: RequestOptions = {},
): Promise<BarberProfile> {
  if (body.photo) {
    const form = new FormData();
    appendRNFile(form, 'photo', body.photo);
    if (body.fullName !== undefined) form.append('fullName', body.fullName);
    if (body.shopName !== undefined) form.append('shopName', body.shopName);
    if (body.phone !== undefined) form.append('phone', body.phone);
    if (body.streetAddress !== undefined) form.append('streetAddress', body.streetAddress);
    if (body.city !== undefined) form.append('city', body.city);
    if (body.state !== undefined) form.append('state', body.state);
    if (body.zipCode !== undefined) form.append('zipCode', body.zipCode);
    if (body.latitude !== undefined) form.append('latitude', String(body.latitude));
    if (body.longitude !== undefined) form.append('longitude', String(body.longitude));
    if (body.bio !== undefined) form.append('bio', body.bio);
    if (body.instagramHandle !== undefined) form.append('instagramHandle', body.instagramHandle);

    const { data: res } = await apiClient.patch('/barber/profile', form, {
      signal: opts.signal,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return ProfileSchema.parse(extractPayload(res));
  }

  const { photo: _, ...jsonBody } = body;
  const { data: res } = await apiClient.patch('/barber/profile', jsonBody, {
    signal: opts.signal,
  });
  return ProfileSchema.parse(extractPayload(res));
}
