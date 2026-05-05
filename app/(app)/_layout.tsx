import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useProfile } from '@/lib/hooks/useProfile';
import {
  registerPushToken,
  setupNotificationListeners,
} from '@/lib/utils/push-notifications';

export default function AppLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);

  // Fetch profile early so user is populated in auth store for downstream hooks
  useProfile();

  useEffect(() => {
    if (!accessToken) return;

    registerPushToken().then((token) => {
      if (token) useAuthStore.getState().setPushToken(token);
    });

    const cleanup = setupNotificationListeners();
    return cleanup;
  }, [accessToken]);

  if (!accessToken) return <Redirect href="/(auth)/welcome" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'ios' ? 'slide_from_right' : 'fade_from_bottom',
        animationDuration: 280,
        gestureEnabled: true,
      }}
    />
  );
}
