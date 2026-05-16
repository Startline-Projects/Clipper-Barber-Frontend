import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as settingsApi from '@/lib/api/settings';
import { useBarberHome, BARBER_HOME_QUERY_KEY } from '@/lib/hooks/useBarberHome';

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

export function useAutoConfirm() {
  const qc = useQueryClient();
  const allowAutoConfirm = useAutoConfirmStore((s) => s.allowAutoConfirm);
  const autoConfirmToday = useAutoConfirmStore((s) => s.autoConfirmToday);
  const setBoth = useAutoConfirmStore((s) => s.setBoth);
  const setAllow = useAutoConfirmStore((s) => s.setAllow);
  const setToday = useAutoConfirmStore((s) => s.setToday);

  const { data: home } = useBarberHome();
  useEffect(() => {
    if (home) setBoth(home.allowAutoConfirm, home.autoConfirmToday);
  }, [home, setBoth]);

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
      qc.invalidateQueries({ queryKey: BARBER_HOME_QUERY_KEY });
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
      qc.invalidateQueries({ queryKey: BARBER_HOME_QUERY_KEY });
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
