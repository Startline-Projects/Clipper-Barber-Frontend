export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

export const GOOGLE_PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '';

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 50,
  maxLimitPage: 100,
  messagesDefaultLimit: 30,
} as const;
