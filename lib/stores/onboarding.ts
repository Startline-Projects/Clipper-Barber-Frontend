import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingDraft {
  step1?: { fullName?: string; email?: string };
  step2?: {
    shopName?: string;
    phone?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
  };
  step3?: { bio?: string; instagramHandle?: string };
}

interface OnboardingState {
  draft: OnboardingDraft;
  patchDraft: <K extends keyof OnboardingDraft>(
    step: K,
    values: OnboardingDraft[K],
  ) => void;
  clearDraft: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      draft: {},
      patchDraft: (step, values) =>
        set((s) => ({
          draft: { ...s.draft, [step]: { ...s.draft[step], ...values } },
        })),
      clearDraft: () => set({ draft: {} }),
    }),
    {
      name: 'clipper_onboarding_draft',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);

export const useOnboardingDraft = () => useOnboardingStore((s) => s.draft);
