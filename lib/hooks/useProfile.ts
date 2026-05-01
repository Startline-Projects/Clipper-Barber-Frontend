// lib/hooks/useProfile.ts
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { queryKeys } from './queryKeys';
import { invalidations } from './invalidations';
import * as profileApi from '@/lib/api/profile';
import type { Profile } from '@/lib/api/profile';

export function useProfile() {
  const hasTokens = useAuthStore((s) => Boolean(s.accessToken));
  const result = useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: ({ signal }) => profileApi.getProfile({ signal }),
    enabled: hasTokens,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (result.data && !useAuthStore.getState().user) {
      useAuthStore.getState().setUser({
        id: result.data.id,
        email: '',
        username: result.data.full_name,
      });
    }
  }, [result.data]);

  return result;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: profileApi.UpdateProfileBody) =>
      profileApi.updateProfile(body),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: queryKeys.profile.me() });
      const previous = qc.getQueryData<Profile>(queryKeys.profile.me());
      if (previous) {
        qc.setQueryData<Profile>(queryKeys.profile.me(), {
          ...previous,
          ...patch,
        });
      }
      return { previous };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(queryKeys.profile.me(), ctx.previous);
      }
    },
    onSettled: () => invalidations.profileUpdated(qc),
  });
}