import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { queryKeys } from './queryKeys';
import { invalidations } from './invalidations';
import * as servicesApi from '@/lib/api/services';
import type { Service } from '@/lib/api/services';

export function useServices() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.services.list(),
    queryFn: ({ signal }) => servicesApi.listServices({ signal }),
    enabled: Boolean(user),
    staleTime: 60_000,
  });
}

export function useService(serviceId: string) {
  return useQuery({
    queryKey: queryKeys.services.detail(serviceId),
    queryFn: ({ signal }) => servicesApi.getService(serviceId, { signal }),
    enabled: Boolean(serviceId),
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: servicesApi.CreateServiceBody) =>
      servicesApi.createService(body),
    onSuccess: () => invalidations.serviceListMutated(qc),
  });
}

export interface UpdateServiceVariables {
  serviceId: string;
  body: servicesApi.UpdateServiceBody;
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, body }: UpdateServiceVariables) =>
      servicesApi.updateService(serviceId, body),
    onSuccess: (_data, vars) => invalidations.serviceUpdated(qc, vars.serviceId),
  });
}

export function useToggleService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) => servicesApi.toggleService(serviceId),
    onMutate: async (serviceId) => {
      await qc.cancelQueries({ queryKey: queryKeys.services.lists() });
      const previous = qc.getQueryData<Service[]>(queryKeys.services.list());
      qc.setQueryData<Service[]>(queryKeys.services.list(), (old) =>
        old?.map((s) =>
          s.id === serviceId ? { ...s, isActive: !s.isActive } : s,
        ),
      );
      return { previous };
    },
    onError: (_err, _serviceId, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(queryKeys.services.list(), ctx.previous);
      }
    },
    onSettled: () => invalidations.serviceListMutated(qc),
  });
}

export function useReorderServices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serviceIds: string[]) => servicesApi.reorderServices(serviceIds),
    onMutate: async (serviceIds) => {
      await qc.cancelQueries({ queryKey: queryKeys.services.lists() });
      const previous = qc.getQueryData<Service[]>(queryKeys.services.list());
      if (previous) {
        const byId = new Map(previous.map((s) => [s.id, s]));
        const reordered = serviceIds
          .map((id) => byId.get(id))
          .filter((s): s is Service => Boolean(s));
        qc.setQueryData(queryKeys.services.list(), reordered);
      }
      return { previous };
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(queryKeys.services.list(), ctx.previous);
      }
    },
    onSettled: () => invalidations.serviceListMutated(qc),
  });
}
