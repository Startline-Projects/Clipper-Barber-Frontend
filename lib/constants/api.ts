export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 50,
  maxLimitPage: 100,
  messagesDefaultLimit: 30,
} as const;
