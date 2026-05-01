import { create } from 'zustand';
import type { z } from 'zod';
import type {
  BookingTimeframe,
  BookingType,
  BookingStatus,
  BookingTypeFilter,
  AnalyticsPeriod,
} from '@/lib/schemas/enums';

type Timeframe = z.infer<typeof BookingTimeframe>;
type BType = z.infer<typeof BookingType>;
type BStatus = z.infer<typeof BookingStatus>;
type BTypeFilter = z.infer<typeof BookingTypeFilter>;
type Period = z.infer<typeof AnalyticsPeriod>;

interface BookingFilters {
  timeframe: Timeframe;
  type: BType | null;
  status: BStatus | null;
  kind: BTypeFilter | null;
}

const DEFAULT_FILTERS: BookingFilters = {
  timeframe: 'upcoming',
  type: null,
  status: null,
  kind: null,
};

interface FiltersState {
  booking: BookingFilters;
  analyticsPeriod: Period;
  conversationSearch: string;
  patchBookingFilters: (patch: Partial<BookingFilters>) => void;
  resetBookingFilters: () => void;
  setAnalyticsPeriod: (period: Period) => void;
  setConversationSearch: (search: string) => void;
}

export const useFiltersStore = create<FiltersState>((set) => ({
  booking: DEFAULT_FILTERS,
  analyticsPeriod: 'month',
  conversationSearch: '',
  patchBookingFilters: (patch) =>
    set((s) => ({ booking: { ...s.booking, ...patch } })),
  resetBookingFilters: () => set({ booking: DEFAULT_FILTERS }),
  setAnalyticsPeriod: (analyticsPeriod) => set({ analyticsPeriod }),
  setConversationSearch: (conversationSearch) => set({ conversationSearch }),
}));

export const useBookingFilters = () => useFiltersStore((s) => s.booking);
export const usePatchBookingFilters = () => useFiltersStore((s) => s.patchBookingFilters);
export const useAnalyticsPeriod = () => useFiltersStore((s) => s.analyticsPeriod);
export const useConversationSearch = () => useFiltersStore((s) => s.conversationSearch);
