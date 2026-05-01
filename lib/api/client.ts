import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/lib/stores/auth.store';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retried?: boolean;
  }
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_URL is not set');
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Single-flight refresh
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(token: string | null, error: unknown) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  refreshQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retried
    ) {
      return Promise.reject(normalizeError(error));
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject: (err) => reject(normalizeError(err)),
        });
      });
    }

    originalRequest._retried = true;
    isRefreshing = true;

    try {
      const { refreshToken, setTokens, logout } = useAuthStore.getState();
      if (!refreshToken) {
        await logout();
        flushQueue(null, error);
        return Promise.reject(normalizeError(error));
      }

      // Use raw axios to bypass our interceptors
      const { data } = await axios.post<{
        accessToken: string;
        refreshToken: string;
      }>(`${BASE_URL}/auth/refresh`, { refreshToken });

      await setTokens(data.accessToken, data.refreshToken);
      flushQueue(data.accessToken, null);

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      flushQueue(null, refreshError);
      await useAuthStore.getState().logout();
      return Promise.reject(normalizeError(refreshError));
    } finally {
      isRefreshing = false;
    }
  },
);

export interface ApiError {
  status: number;
  message: string;
  code: string | null;
  isNetwork: boolean;
  isTimeout: boolean;
}

function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; code?: string }
      | undefined;
    return {
      status: error.response?.status ?? 0,
      message: data?.message ?? error.message,
      code: data?.code ?? null,
      isNetwork: !error.response,
      isTimeout: error.code === 'ECONNABORTED',
    };
  }
  return {
    status: 0,
    message: 'Unknown error',
    code: null,
    isNetwork: false,
    isTimeout: false,
  };
}