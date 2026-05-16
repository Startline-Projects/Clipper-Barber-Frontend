import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { getBarberHome } from '@/lib/api/home';

export const BARBER_HOME_QUERY_KEY = ['barber', 'home'] as const;

export function useBarberHome() {
  const hasTokens = useAuthStore((s) => Boolean(s.accessToken));
  return useQuery({
    queryKey: BARBER_HOME_QUERY_KEY,
    queryFn: ({ signal }) => getBarberHome(signal),
    enabled: hasTokens,
    staleTime: 30_000,
  });
}
