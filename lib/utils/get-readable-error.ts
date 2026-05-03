import type { ApiError } from '@/lib/api/client';

const FALLBACK = 'Something went wrong. Please try again.';
const NETWORK_MESSAGE = 'No internet connection. Check your network and try again.';
const TIMEOUT_MESSAGE = 'The request timed out. Please try again.';
const SERVER_MESSAGE = 'Our servers had a hiccup. Please try again in a moment.';

function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    'message' in err &&
    'isNetwork' in err
  );
}

export function getReadableError(err: unknown): string {
  if (!err) return FALLBACK;

  if (isApiError(err)) {
    if (err.isNetwork) return NETWORK_MESSAGE;
    if (err.isTimeout) return TIMEOUT_MESSAGE;
    if (err.status >= 500) return SERVER_MESSAGE;
    if (err.message && !looksLikeRawJson(err.message)) return err.message;
    return FALLBACK;
  }

  if (err instanceof Error) {
    if (err.message && !looksLikeRawJson(err.message)) return err.message;
    return FALLBACK;
  }

  if (typeof err === 'string') return err;

  return FALLBACK;
}

function looksLikeRawJson(s: string): boolean {
  const trimmed = s.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}
