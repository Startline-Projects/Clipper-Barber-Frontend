import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { registerDeviceToken, removeDeviceToken } from '@/lib/api/device-token';
import { queryClient } from '@/lib/utils/query-client';
import { queryKeys } from '@/lib/hooks/queryKeys';
import { toast } from '@/lib/stores/toast';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function requestPushPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return token.data;
  } catch {
    return null;
  }
}

export async function registerPushToken(): Promise<string | null> {
  const granted = await requestPushPermissions();
  if (!granted) return null;

  const token = await getExpoPushToken();
  if (!token) return null;

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  try {
    await registerDeviceToken({ token, platform });
  } catch {
    // Best-effort — don't block app launch
  }

  return token;
}

export async function unregisterPushToken(token: string): Promise<void> {
  try {
    await removeDeviceToken(token);
  } catch {
    // Best-effort cleanup
  }
}

export function handleNotificationTap(
  response: Notifications.NotificationResponse,
): void {
  const data = response.notification.request.content.data as Record<
    string,
    string | undefined
  >;

  if (data.conversationId) {
    router.push(`/(app)/(tabs)/messages/${data.conversationId}`);
    return;
  }

  if (data.bookingId) {
    router.push(`/(app)/(tabs)/today/${data.bookingId}`);
    return;
  }

  if (data.recurringBookingId) {
    router.push(
      `/(app)/(tabs)/bookings/recurring/${data.recurringBookingId}`,
    );
    return;
  }

  router.push('/(app)/(tabs)/today/notifications');
}

function handleForegroundNotification(
  notification: Notifications.Notification,
): void {
  const data = notification.request.content.data as Record<
    string,
    string | undefined
  >;
  const type = data?.type;

  switch (type) {
    case 'recurring_resumed': {
      const clientName = data.clientName ?? 'A client';
      toast.success(
        `${clientName} has resumed your recurring arrangement.`,
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.recurring.lists(),
      });
      if (data.recurringBookingId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.recurring.detail(data.recurringBookingId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(),
      });
      return;
    }
    default:
      return;
  }
}

export function setupNotificationListeners(): () => void {
  const tapSub = Notifications.addNotificationResponseReceivedListener(
    handleNotificationTap,
  );
  const receivedSub = Notifications.addNotificationReceivedListener(
    handleForegroundNotification,
  );

  return () => {
    tapSub.remove();
    receivedSub.remove();
  };
}
