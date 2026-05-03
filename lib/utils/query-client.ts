import {
  MutationCache,
  QueryClient,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import type { ApiError } from '@/lib/api/client';
import { toast } from '@/lib/stores/toast';
import { getReadableError } from '@/lib/utils/get-readable-error';

const STALE_TIME = 2 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;

// Catch mutation errors that don't define their own onError so the user always
// gets feedback (no silent failures from optimistic-only updates).
const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    const handled = mutation.options.onError !== undefined;
    if (handled) return;
    toast.error(getReadableError(error));
  },
});

export const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      retry: (failureCount, error) => {
        const apiError = error as Partial<ApiError>;
        // Don't retry client errors (4xx) — they won't get better
        if (
          typeof apiError?.status === 'number' &&
          apiError.status >= 400 &&
          apiError.status < 500
        ) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

// Wire focus manager to AppState (RN doesn't have window.focus)
focusManager.setEventListener((handleFocus) => {
  const sub = AppState.addEventListener('change', (status) => {
    if (Platform.OS !== 'web') handleFocus(status === 'active');
  });
  return () => sub.remove();
});

// Wire online manager to NetInfo (RN doesn't have navigator.onLine)
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});