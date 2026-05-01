import * as SecureStore from 'expo-secure-store';

const KEYS = {
  accessToken: 'clipper_access_token',
  refreshToken: 'clipper_refresh_token',
} as const;

type TokenKey = keyof typeof KEYS;

const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function getToken(key: TokenKey): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS[key], OPTIONS);
  } catch (err) {
    console.warn(`[secureStore] failed to read ${key}:`, err);
    return null;
  }
}

export async function setToken(key: TokenKey, value: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS[key], value, OPTIONS);
}

export async function deleteToken(key: TokenKey): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEYS[key], OPTIONS);
  } catch (err) {
    console.warn(`[secureStore] failed to delete ${key}:`, err);
  }
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    deleteToken('accessToken'),
    deleteToken('refreshToken'),
  ]);
}