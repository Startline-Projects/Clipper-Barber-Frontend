import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { queryKeys } from './queryKeys';
import { invalidations } from './invalidations';
import * as scheduleApi from '@/lib/api/schedule';
import type { Schedule, DayOfWeek } from '@/lib/api/schedule';

export function useSchedule() {
  const hasTokens = useAuthStore((s) => Boolean(s.accessToken));
  return useQuery({
    queryKey: queryKeys.schedule.weekly(),
    queryFn: ({ signal }) => scheduleApi.getSchedule({ signal }),
    enabled: hasTokens,
    staleTime: 5 * 60_000,
  });
}

export interface UpdateScheduleDayVariables {
  dayOfWeek: DayOfWeek;
  body: scheduleApi.UpdateScheduleDayBody;
}

export function useUpdateScheduleDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dayOfWeek, body }: UpdateScheduleDayVariables) =>
      scheduleApi.updateScheduleDay(dayOfWeek, body),
    onMutate: async ({ dayOfWeek, body }) => {
      await qc.cancelQueries({ queryKey: queryKeys.schedule.weekly() });
      const previous = qc.getQueryData<Schedule>(queryKeys.schedule.weekly());
      if (previous) {
        qc.setQueryData<Schedule>(queryKeys.schedule.weekly(), {
          ...previous,
          days: previous.days.map((d) =>
            d.dayOfWeek === dayOfWeek ? { ...d, ...body } : d,
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(queryKeys.schedule.weekly(), ctx.previous);
      }
    },
    onSuccess: (updatedDay) => {
      // Patch the single day into cache instead of full refetch
      const prev = qc.getQueryData<Schedule>(queryKeys.schedule.weekly());
      if (prev) {
        qc.setQueryData<Schedule>(queryKeys.schedule.weekly(), {
          ...prev,
          days: prev.days.map((d) =>
            d.dayOfWeek === updatedDay.dayOfWeek ? updatedDay : d,
          ),
        });
      }
    },
  });
}
