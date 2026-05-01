import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { z } from 'zod';
import { ThemePreference } from '@/lib/schemas/enums';

type ThemePref = z.infer<typeof ThemePreference>;

interface ThemeState {
  themePreference: ThemePref;
  hasHydrated: boolean;
  setThemePreference: (pref: ThemePref) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themePreference: 'system',
      hasHydrated: false,
      setThemePreference: (pref) => {
        const parsed = ThemePreference.safeParse(pref);
        if (parsed.success) set({ themePreference: parsed.data });
      },
    }),
    {
      name: 'clipper_theme_preference',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ themePreference: s.themePreference }),
      onRehydrateStorage: () => () => {
        useThemeStore.setState({ hasHydrated: true });
      },
    },
  ),
);

export const useThemePreference = () => useThemeStore((s) => s.themePreference);
export const useThemeHasHydrated = () => useThemeStore((s) => s.hasHydrated);
export const useSetThemePreference = () => useThemeStore((s) => s.setThemePreference);
