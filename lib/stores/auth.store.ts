import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, setToken, clearTokens } from '@/lib/utils/secure-store';
import { unregisterPushToken } from '@/lib/utils/push-notifications';

const HAS_LAUNCHED_KEY = 'clipper_has_launched';
const EMAIL_VERIFIED_KEY = 'clipper_email_verified';
const EMAIL_KEY = 'clipper_email';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  pushToken: string | null;
  hasLaunched: boolean;
  isHydrated: boolean;
  /** null = unknown; false = known unverified; true = verified. */
  emailVerified: boolean | null;
  /** Email of the currently-signed-in account, persisted across launches. */
  email: string | null;

  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setPushToken: (token: string | null) => void;
  setEmailVerified: (verified: boolean) => Promise<void>;
  setEmail: (email: string | null) => Promise<void>;
  markLaunched: () => Promise<void>;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  pushToken: null,
  hasLaunched: false,
  isHydrated: false,
  emailVerified: null,
  email: null,

  setTokens: async (accessToken, refreshToken) => {
    await Promise.all([
      setToken('accessToken', accessToken),
      setToken('refreshToken', refreshToken),
    ]);
    set({ accessToken, refreshToken });
  },

  setUser: (user) => set({ user }),

  setPushToken: (token) => set({ pushToken: token }),

  setEmailVerified: async (verified) => {
    await AsyncStorage.setItem(EMAIL_VERIFIED_KEY, verified ? '1' : '0');
    set({ emailVerified: verified });
  },

  setEmail: async (email) => {
    if (email) await AsyncStorage.setItem(EMAIL_KEY, email);
    else await AsyncStorage.removeItem(EMAIL_KEY);
    set({ email });
  },

  markLaunched: async () => {
    await AsyncStorage.setItem(HAS_LAUNCHED_KEY, '1');
    set({ hasLaunched: true });
  },

  hydrate: async () => {
    try {
      const [accessToken, refreshToken, launched, verified, email] =
        await Promise.all([
          getToken('accessToken'),
          getToken('refreshToken'),
          AsyncStorage.getItem(HAS_LAUNCHED_KEY),
          AsyncStorage.getItem(EMAIL_VERIFIED_KEY),
          AsyncStorage.getItem(EMAIL_KEY),
        ]);
      set({
        accessToken,
        refreshToken,
        hasLaunched: launched === '1',
        emailVerified: verified === null ? null : verified === '1',
        email,
      });
    } finally {
      set({ isHydrated: true });
    }
  },

  logout: async () => {
    const { pushToken } = get();
    if (pushToken) {
      await unregisterPushToken(pushToken);
    }
    await clearTokens();
    await AsyncStorage.multiRemove([EMAIL_VERIFIED_KEY, EMAIL_KEY]);
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      pushToken: null,
      emailVerified: null,
      email: null,
    });
  },
}));

// Derived selector — single source of truth
export const useIsAuthenticated = () =>
  useAuthStore((s) => !!s.accessToken);
