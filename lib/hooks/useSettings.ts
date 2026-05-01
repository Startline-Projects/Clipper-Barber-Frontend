import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import * as settingsApi from '@/lib/api/settings';
import type { BarberProfile } from '@/lib/api/profile';

function patchProfileCache(
  qc: ReturnType<typeof useQueryClient>,
  patch: Partial<BarberProfile>,
) {
  qc.setQueryData<BarberProfile>(queryKeys.profile.me(), (old) =>
    old ? { ...old, ...patch } : old,
  );
}

export function useToggleAutoConfirm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => settingsApi.toggleAutoConfirm(enabled),
    onMutate: async (enabled) => {
      await qc.cancelQueries({ queryKey: queryKeys.profile.me() });
      const previous = qc.getQueryData<BarberProfile>(queryKeys.profile.me());
      patchProfileCache(qc, { allowAutoConfirm: enabled });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.profile.me(), ctx.previous);
    },
    onSuccess: (res) => {
      patchProfileCache(qc, {
        allowAutoConfirm: res.allowAutoConfirm,
        autoConfirmToday: res.autoConfirmToday,
      });
    },
  });
}

export function useToggleAutoConfirmToday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      settingsApi.toggleAutoConfirmToday(enabled),
    onMutate: async (enabled) => {
      await qc.cancelQueries({ queryKey: queryKeys.profile.me() });
      const previous = qc.getQueryData<BarberProfile>(queryKeys.profile.me());
      patchProfileCache(qc, { autoConfirmToday: enabled });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.profile.me(), ctx.previous);
    },
    onSuccess: (res) => {
      patchProfileCache(qc, {
        allowAutoConfirm: res.allowAutoConfirm,
        autoConfirmToday: res.autoConfirmToday,
      });
    },
  });
}

export function useToggleRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => settingsApi.toggleRecurring(enabled),
    onMutate: async (enabled) => {
      await qc.cancelQueries({ queryKey: queryKeys.profile.me() });
      const previous = qc.getQueryData<BarberProfile>(queryKeys.profile.me());
      patchProfileCache(qc, { recurringEnabled: enabled });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.profile.me(), ctx.previous);
    },
    onSuccess: (res) => {
      patchProfileCache(qc, { recurringEnabled: res.recurringEnabled });
    },
  });
}

export interface UpdateNoShowChargeVariables {
  enabled: boolean;
  amountUsd?: number;
}

export function useUpdateNoShowCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpdateNoShowChargeVariables) =>
      settingsApi.updateNoShowCharge(vars),
    onSuccess: (res) => {
      patchProfileCache(qc, {
        noShowChargeEnabled: res.enabled,
        noShowChargeAmountUsd: res.amountUsd,
      });
    },
  });
}
