import { useCallback } from 'react';
import { create } from 'zustand';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth.store';
import * as settingsApi from '@/lib/api/settings';

interface AutoConfirmState {
  allowAutoConfirm: boolean;
  autoConfirmToday: boolean;
  hasSeed: boolean;
  setBoth: (allow: boolean, today: boolean) => void;
  setAllow: (v: boolean) => void;
  setToday: (v: boolean) => void;
}

const useAutoConfirmStore = create<AutoConfirmState>((set) => ({
  allowAutoConfirm: false,
  autoConfirmToday: false,
  hasSeed: false,
  setBoth: (allow, today) =>
    set({ allowAutoConfirm: allow, autoConfirmToday: today, hasSeed: true }),
  setAllow: (v) => set({ allowAutoConfirm: v }),
  setToday: (v) => set({ autoConfirmToday: v }),
}));

const HomeSeedSchema = z.object({
  allowAutoConfirm: z.boolean(),
  autoConfirmToday: z.boolean(),
});

async function fetchHomeSettingsSeed(signal?: AbortSignal) {
  const { data } = await apiClient.get('/barber/home', { signal });
  return HomeSeedSchema.parse(data);
}

export function useAutoConfirm() {
  const qc = useQueryClient();
  const hasTokens = useAuthStore((s) => Boolean(s.accessToken));
  const allowAutoConfirm = useAutoConfirmStore((s) => s.allowAutoConfirm);
  const autoConfirmToday = useAutoConfirmStore((s) => s.autoConfirmToday);
  const setBoth = useAutoConfirmStore((s) => s.setBoth);
  const setAllow = useAutoConfirmStore((s) => s.setAllow);
  const setToday = useAutoConfirmStore((s) => s.setToday);

  useQuery({
    queryKey: ['barber', 'home', 'autoConfirmSeed'],
    queryFn: async ({ signal }) => {
      const seed = await fetchHomeSettingsSeed(signal);
      setBoth(seed.allowAutoConfirm, seed.autoConfirmToday);
      return seed;
    },
    enabled: hasTokens,
    staleTime: 60_000,
    retry: false,
  });

  const allowMutation = useMutation({
    mutationFn: (enabled: boolean) => settingsApi.toggleAutoConfirm(enabled),
    onMutate: (enabled) => {
      const prev = {
        allow: useAutoConfirmStore.getState().allowAutoConfirm,
        today: useAutoConfirmStore.getState().autoConfirmToday,
      };
      setAllow(enabled);
      return prev;
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) setBoth(ctx.allow, ctx.today);
    },
    onSuccess: (res) => {
      setBoth(res.allowAutoConfirm, res.autoConfirmToday);
      qc.invalidateQueries({ queryKey: ['barber', 'home'] });
    },
  });

  const todayMutation = useMutation({
    mutationFn: (enabled: boolean) => settingsApi.toggleAutoConfirmToday(enabled),
    onMutate: (enabled) => {
      const prev = {
        allow: useAutoConfirmStore.getState().allowAutoConfirm,
        today: useAutoConfirmStore.getState().autoConfirmToday,
      };
      setToday(enabled);
      return prev;
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) setBoth(ctx.allow, ctx.today);
    },
    onSuccess: (res) => {
      setBoth(res.allowAutoConfirm, res.autoConfirmToday);
      qc.invalidateQueries({ queryKey: ['barber', 'home'] });
    },
  });

  const mutateAutoConfirm = useCallback(
    (enabled: boolean) => allowMutation.mutate(enabled),
    [allowMutation],
  );
  const mutateAutoConfirmToday = useCallback(
    (enabled: boolean) => todayMutation.mutate(enabled),
    [todayMutation],
  );

  return {
    allowAutoConfirm,
    autoConfirmToday,
    mutateAutoConfirm,
    mutateAutoConfirmToday,
    isPending: allowMutation.isPending || todayMutation.isPending,
  };
}
