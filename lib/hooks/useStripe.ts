import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { queryKeys } from './queryKeys';
import { invalidations } from './invalidations';
import * as stripeApi from '@/lib/api/stripe';

export function useConnectStatus() {
  const hasTokens = useAuthStore((s) => Boolean(s.accessToken));
  return useQuery({
    queryKey: queryKeys.stripe.account(),
    queryFn: ({ signal }) => stripeApi.getConnectStatus({ signal }),
    enabled: hasTokens,
    staleTime: 0,
  });
}

export function useOnboardConnect() {
  return useMutation({
    mutationFn: stripeApi.onboardConnect,
  });
}

export function useDisconnectConnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: stripeApi.disconnectConnect,
    onSuccess: () => invalidations.stripeStatusChanged(qc),
  });
}
