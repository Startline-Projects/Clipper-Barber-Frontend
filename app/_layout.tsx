import './global.css';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/utils/query-client';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useTheme } from '@/lib/hooks/useTheme';
import { useThemeHasHydrated } from '@/lib/stores/theme';
import ToastHost from '@/components/feedback/Toast';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasLaunched = useAuthStore((s) => s.hasLaunched);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuth = segments[0] === '(auth)';
    // Signup is a multi-step flow that issues a token at step1; keep the
    // barber inside it until they finish or skip the remaining steps.
    const inSignup = inAuth && segments[1] === 'signup';

    if (!accessToken && !inAuth) {
      router.replace(hasLaunched ? '/(auth)/login' : '/(auth)/welcome');
    } else if (accessToken && inAuth && !inSignup) {
      router.replace('/(app)/(tabs)/today');
    }
  }, [accessToken, hasLaunched, isHydrated, segments]);

  return null;
}

function RootInner() {
  const theme = useTheme();

  return (
    <View className={`flex-1 bg-bg ${theme === 'dark' ? 'dark' : ''}`}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <AuthRedirect />
      <Slot />
      <ToastHost />
    </View>
  );
}

export default function RootLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const themeHydrated = useThemeHasHydrated();

  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (isHydrated && themeHydrated) {
      SplashScreen.hideAsync();
    }
  }, [isHydrated, themeHydrated]);

  if (!isHydrated || !themeHydrated) return null;

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <RootInner />
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
