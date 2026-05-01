import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, setToken, clearTokens } from '@/lib/utils/secure-store';
import { unregisterPushToken } from '@/lib/utils/push-notifications';

const HAS_LAUNCHED_KEY = 'clipper_has_launched';

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

  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setPushToken: (token: string | null) => void;
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

  setTokens: async (accessToken, refreshToken) => {
    await Promise.all([
      setToken('accessToken', accessToken),
      setToken('refreshToken', refreshToken),
    ]);
    set({ accessToken, refreshToken });
  },

  setUser: (user) => set({ user }),

  setPushToken: (token) => set({ pushToken: token }),

  markLaunched: async () => {
    await AsyncStorage.setItem(HAS_LAUNCHED_KEY, '1');
    set({ hasLaunched: true });
  },

  hydrate: async () => {
    try {
      const [accessToken, refreshToken, launched] = await Promise.all([
        getToken('accessToken'),
        getToken('refreshToken'),
        AsyncStorage.getItem(HAS_LAUNCHED_KEY),
      ]);
      set({ accessToken, refreshToken, hasLaunched: launched === '1' });
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
    set({ accessToken: null, refreshToken: null, user: null, pushToken: null });
  },
}));

// Derived selector — single source of truth
export const useIsAuthenticated = () =>
  useAuthStore((s) => !!s.accessToken);