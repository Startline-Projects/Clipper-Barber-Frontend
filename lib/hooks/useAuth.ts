import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { queryKeys } from './queryKeys';
import { invalidations } from './invalidations';
import * as authApi from '@/lib/api/auth';

export function useMe() {
  const hasTokens = useAuthStore((s) => Boolean(s.accessToken));
  return useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: ({ signal }) => authApi.getMe({ signal }),
    enabled: hasTokens,
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: authApi.LoginBody) => authApi.login(body),
    onSuccess: async (res) => {
      const { setTokens, setUser, setEmail, markLaunched } =
        useAuthStore.getState();
      await setTokens(res.accessToken, res.refreshToken);
      setUser({ id: res.id, email: res.email, username: res.username });
      await setEmail(res.email);
      await markLaunched();
      qc.invalidateQueries({ queryKey: queryKeys.profile.me() });
    },
  });
}

export function useSignupStep1() {
  return useMutation({
    mutationFn: (body: authApi.SignupStep1Body) => authApi.signupStep1(body),
    onSuccess: async (res, vars) => {
      const { setTokens, setEmail, setEmailVerified, markLaunched } =
        useAuthStore.getState();
      await setTokens(res.accessToken, res.refreshToken);
      await setEmail(vars.email);
      // Backend now creates barbers as unverified after step1; a confirmation
      // email is dispatched. Surface that state in the UI until the user taps
      // the deep link.
      await setEmailVerified(false);
      await markLaunched();
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (body: { token: string; type?: 'signup' | 'email' }) =>
      authApi.verifyEmail(body),
    onSuccess: async () => {
      await useAuthStore.getState().setEmailVerified(true);
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (body: { email: string }) => authApi.resendVerification(body),
  });
}

export function useSignupStep2() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: authApi.SignupStep2Body) => authApi.signupStep2(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.me() });
    },
  });
}

export function useSignupStep3() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: authApi.SignupStep3Body) => authApi.signupStep3(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.me() });
    },
  });
}

export function useSignupStep4() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: authApi.SignupStep4Body) => authApi.signupStep4(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.me() });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { logout } = useAuthStore.getState();
      // Server first so the refresh token is revoked while we still have it.
      // If it fails, log locally anyway — best-effort server cleanup.
      try {
        await authApi.logout();
      } catch {
        /* swallow — local logout is the source of truth */
      }
      await logout();
      invalidations.onLogout(qc);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (body: { email: string }) => authApi.forgotPassword(body),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (body: { token: string; newPassword: string }) =>
      authApi.resetPassword(body),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(body),
  });
}
