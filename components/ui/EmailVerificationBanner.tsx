import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from './Icon';
import { useColors } from '@/lib/theme/colors';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useResendVerification } from '@/lib/hooks/useAuth';
import { toast } from '@/lib/stores/toast';
import { getReadableError } from '@/lib/utils/get-readable-error';

const RESEND_COOLDOWN_SECONDS = 60;

interface Props {
  className?: string;
}

export default function EmailVerificationBanner({ className }: Props) {
  const colors = useColors();
  const emailVerified = useAuthStore((s) => s.emailVerified);
  const email = useAuthStore((s) => s.email);
  const resend = useResendVerification();

  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [cooldown]);

  if (emailVerified !== false) return null;
  if (!email) return null;

  const handleResend = () => {
    if (cooldown > 0 || resend.isPending) return;
    resend.mutate(
      { email },
      {
        onSuccess: () => {
          toast.success(
            'If that address is registered, a new verification email has been sent.',
          );
          setCooldown(RESEND_COOLDOWN_SECONDS);
        },
        onError: (err) => toast.error(getReadableError(err)),
      },
    );
  };

  const mm = Math.floor(cooldown / 60);
  const ss = String(cooldown % 60).padStart(2, '0');
  const resendLabel =
    cooldown > 0
      ? `Resend in ${mm}:${ss}`
      : resend.isPending
        ? 'Sending…'
        : 'Resend verification email';

  return (
    <View
      className={`flex-row items-start gap-3 px-4 py-3 rounded-md bg-orange/10 border border-orange/20 ${className ?? ''}`}
    >
      <View className="mt-[2px]">
        <Icon name="bell" size={18} color={colors.orange} />
      </View>
      <View className="flex-1">
        <Text className="text-md font-semibold text-ink tracking-[-0.1px]">
          Confirm your email
        </Text>
        <Text className="text-base text-secondary mt-[2px]">
          We sent a confirmation link to {email}. Tap it to verify your account.
        </Text>
        <Pressable
          onPress={handleResend}
          disabled={cooldown > 0 || resend.isPending}
          accessibilityRole="button"
          className="mt-2 self-start"
        >
          <Text
            className={`text-md font-semibold ${
              cooldown > 0 || resend.isPending ? 'text-tertiary' : 'text-blue'
            }`}
          >
            {resendLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
