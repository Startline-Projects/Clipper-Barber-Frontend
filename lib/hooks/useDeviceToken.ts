import { useMutation } from '@tanstack/react-query';
import * as deviceTokenApi from '@/lib/api/device-token';

export function useRegisterDeviceToken() {
  return useMutation({
    mutationFn: (body: deviceTokenApi.RegisterTokenBody) =>
      deviceTokenApi.registerDeviceToken(body),
  });
}

export function useRemoveDeviceToken() {
  return useMutation({
    mutationFn: (token: string) => deviceTokenApi.removeDeviceToken(token),
  });
}
