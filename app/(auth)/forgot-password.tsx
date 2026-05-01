import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Btn from '@/components/ui/Btn';
import TextField from '@/components/forms/TextField';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import { useForgotPassword } from '@/lib/hooks/useAuth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOLDOWN_SECONDS = 60;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colors = useColors();
  const forgot = useForgotPassword();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const validate = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Email is required');
      return false;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setError('Enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (forgot.isPending || cooldown > 0) return;
    if (!validate()) return;
    forgot.mutate(
      { email: email.trim().toLowerCase() },
      {
        onSuccess: () => {
          setSent(true);
          startCooldown();
        },
        onError: () => {
          setSent(true);
          startCooldown();
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1 px-5"
          keyboardShouldPersistTaps="handled"
        >
          <Header title="Reset password" onBack={() => router.back()} />

          {!sent ? (
            <>
              <Text className="text-[14px] text-secondary leading-[20px] tracking-[-0.1px] mt-1 mb-6">
                Enter the email you signed up with. We'll send a link to reset
                your password.
              </Text>

              <View className="mb-6">
                <TextField
                  label="Email"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (error) setError('');
                  }}
                  placeholder="mo@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="send"
                  onSubmitEditing={handleSubmit}
                  error={error}
                />
              </View>

              <Btn
                label={forgot.isPending ? 'Sending...' : 'Send reset link'}
                full
                onPress={handleSubmit}
                disabled={!email.trim() || forgot.isPending}
              />
            </>
          ) : (
            <View className="items-center mt-8">
              <View className="w-14 h-14 rounded-full bg-green/10 items-center justify-center mb-4">
                <Icon name="check" size={28} color={colors.green} />
              </View>
              <Text className="text-[18px] font-bold text-ink tracking-[-0.3px] mb-2">
                Check your email
              </Text>
              <Text className="text-[14px] text-secondary text-center leading-[20px] tracking-[-0.1px] mb-8 px-4">
                If an account exists for {email.trim().toLowerCase()}, we sent a
                password reset link. Check your inbox and spam folder.
              </Text>

              <Btn
                label={
                  cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend link'
                }
                variant="secondary"
                full
                onPress={handleSubmit}
                disabled={cooldown > 0 || forgot.isPending}
              />

              <View className="mt-4">
                <Btn
                  label="Back to login"
                  variant="ghost"
                  full
                  onPress={() => router.back()}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
