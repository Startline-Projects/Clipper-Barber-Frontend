import './global.css';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/utils/query-client';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useTheme } from '@/lib/hooks/useTheme';
import { useThemeHasHydrated } from '@/lib/stores/theme';
import ToastHost from '@/components/feedback/Toast';
import { verifyEmail } from '@/lib/api/auth';
import { toast } from '@/lib/stores/toast';
import { getReadableError } from '@/lib/utils/get-readable-error';

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

/**
 * Listens for `clipper://auth/confirm?token_hash=...&type=signup` deep links
 * emitted by the Supabase confirmation email, exchanges the token at
 * `/auth/verify-email`, and flips the local emailVerified flag.
 */
function EmailVerificationDeepLink() {
  useEffect(() => {
    let cancelled = false;

    const handleUrl = async (url: string | null) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      const isConfirm =
        parsed.hostname === 'auth' && parsed.path === 'confirm';
      if (!isConfirm) return;

      const tokenHash = parsed.queryParams?.token_hash;
      const type = parsed.queryParams?.type;
      const token = Array.isArray(tokenHash) ? tokenHash[0] : tokenHash;
      const verifyType = Array.isArray(type) ? type[0] : type;
      if (!token) return;

      try {
        await verifyEmail({
          token,
          type: verifyType === 'email' ? 'email' : 'signup',
        });
        if (cancelled) return;
        await useAuthStore.getState().setEmailVerified(true);
        toast.success('Email verified');
      } catch (err) {
        if (cancelled) return;
        toast.error(getReadableError(err));
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return null;
}

function RootInner() {
  const theme = useTheme();

  return (
    <View className={`flex-1 bg-bg ${theme === 'dark' ? 'dark' : ''}`}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <AuthRedirect />
      <EmailVerificationDeepLink />
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
