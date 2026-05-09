import { z } from 'zod';
import { apiClient } from './client';

// ---------- Response schemas ----------

const TokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

const LoginResponseSchema = TokensSchema.extend({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  redirectTo: z.string().optional(),
});

const MeSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  role: z.enum(['barber', 'client']),
  shopName: z.string().nullable(),
  onboardingComplete: z.boolean(),
});

// ---------- Public types ----------

export type Tokens = z.infer<typeof TokensSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type Me = z.infer<typeof MeSchema>;

export interface SignupStep1Body {
  fullName: string;
  email: string;
  password: string;
}

export interface SignupStep2Body {
  shopName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

export interface RNFile {
  uri: string;
  type: string;
  name: string;
}

export interface SignupStep3Body {
  photo?: RNFile;
  bio?: string;
  instagramHandle?: string;
}

export interface LoginBody {
  email: string;
  password: string;
  role: 'barber' | 'client';
}

interface RequestOptions {
  signal?: AbortSignal;
}

// ---------- Helpers ----------

/**
 * RN's FormData accepts { uri, type, name } directly, but DOM lib types
 * the second arg as Blob. The cast is intentional and isolated here.
 */
function appendRNFile(form: FormData, key: string, file: RNFile): void {
  form.append(key, file as unknown as Blob);
}

// ---------- Endpoints ----------

export async function signupStep1(
  body: SignupStep1Body,
  opts: RequestOptions = {},
): Promise<Tokens> {
  const { data } = await apiClient.post('/auth/barber/step1', body, {
    signal: opts.signal,
  });
  return TokensSchema.parse(data);
}

export async function signupStep2(
  body: SignupStep2Body,
  opts: RequestOptions = {},
): Promise<void> {
  await apiClient.post('/auth/barber/step2', body, { signal: opts.signal });
}

export async function signupStep3(
  body: SignupStep3Body,
  opts: RequestOptions = {},
): Promise<void> {
  const form = new FormData();
  if (body.photo) appendRNFile(form, 'photo', body.photo);
  if (body.bio !== undefined) form.append('bio', body.bio);
  if (body.instagramHandle !== undefined) {
    form.append('instagramHandle', body.instagramHandle);
  }

  // The shared apiClient defaults Content-Type to application/json. axios will
  // not override that for FormData, so we must set multipart explicitly. RN's
  // network layer fills in the boundary when the value has none.
  await apiClient.post('/auth/barber/step3', form, {
    signal: opts.signal,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function login(
  body: LoginBody,
  opts: RequestOptions = {},
): Promise<LoginResponse> {
  const { data } = await apiClient.post('/auth/login', body, {
    signal: opts.signal,
  });
  return LoginResponseSchema.parse(data);
}

export async function logout(opts: RequestOptions = {}): Promise<void> {
  await apiClient.post('/auth/logout', undefined, { signal: opts.signal });
}

export async function getMe(opts: RequestOptions = {}): Promise<Me> {
  const { data } = await apiClient.get('/auth/me', { signal: opts.signal });
  return MeSchema.parse(data);
}

export async function forgotPassword(
  body: { email: string },
  opts: RequestOptions = {},
): Promise<void> {
  await apiClient.post('/auth/forgot-password', body, { signal: opts.signal });
}

export async function resetPassword(
  body: { token: string; newPassword: string },
  opts: RequestOptions = {},
): Promise<void> {
  await apiClient.post('/auth/reset-password', body, { signal: opts.signal });
}

export async function changePassword(
  body: { currentPassword: string; newPassword: string },
  opts: RequestOptions = {},
): Promise<void> {
  await apiClient.patch('/auth/change-password', body, { signal: opts.signal });
}
