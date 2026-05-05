import { useCallback, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Btn from '@/components/ui/Btn';
import TextField from '@/components/forms/TextField';
import { useSignupStep1 } from '@/lib/hooks/useAuth';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { toast } from '@/lib/stores/toast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[a-zA-ZÀ-ɏЀ-ӿ؀-ۿ\s'\-\.]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function SignupStep1Screen() {
  const router = useRouter();
  const signup = useSignupStep1();
  const { patchDraft } = useOnboardingStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setFullName('');
        setEmail('');
        setPassword('');
        setShowPw(false);
        setErrors({});
        patchDraft('step1', { fullName: '', email: '' });
      };
    }, [patchDraft]),
  );

  const validate = () => {
    const e: typeof errors = {};
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) e.fullName = 'Full name is required';
    else if (trimmedName.length < 2)
      e.fullName = 'Name must be at least 2 characters';
    else if (!NAME_RE.test(trimmedName))
      e.fullName = 'Name can only contain letters';
    if (!trimmedEmail) e.email = 'Email is required';
    else if (!EMAIL_RE.test(trimmedEmail))
      e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < MIN_PASSWORD_LENGTH)
      e.password = `Must be at least ${MIN_PASSWORD_LENGTH} characters`;

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canSubmit =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= MIN_PASSWORD_LENGTH;

  const handleContinue = () => {
    if (signup.isPending) return;
    if (!validate()) return;

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    patchDraft('step1', { fullName: trimmedName, email: trimmedEmail });

    signup.mutate(
      { fullName: trimmedName, email: trimmedEmail, password },
      {
        onSuccess: () => router.push('/(auth)/signup/step2'),
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? err?.message ?? '';
          if (/email.*already|already.*registered/i.test(msg)) {
            setErrors((prev) => ({
              ...prev,
              email: 'This email is already registered',
            }));
          } else {
            toast.error('Sign up failed. Please try again.');
          }
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
          <Header title="" onBack={() => router.back()} />

          <View className="items-center mt-2 mb-5">
            <Image
              source={require('@/assets/images/clipper-logo.png')}
              className="w-16 h-16 rounded-[18px] mb-3"
            />
            <Text className="text-[28px] font-extrabold text-ink tracking-[-0.6px]">
              Clipper
            </Text>
            <Text className="text-md text-secondary mt-1 tracking-[-0.1px]">
              Set up your barber profile
            </Text>
          </View>

          {/* Progress bar */}
          <View className="flex-row gap-[6px] mb-2">
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                className={`flex-1 h-[3px] rounded-full ${
                  i === 0 ? 'bg-ink' : 'bg-separator-opaque'
                }`}
              />
            ))}
          </View>
          <Text className="text-xs font-semibold text-tertiary tracking-[0.6px] uppercase mb-5">
            Step 1 of 3
          </Text>

          <Text className="text-3xl font-extrabold text-ink tracking-[-0.5px] mb-5">
            Your Account
          </Text>

          <View className="mb-4">
            <TextField
              label="Full Name"
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                if (errors.fullName)
                  setErrors((e) => ({ ...e, fullName: undefined }));
              }}
              placeholder="Mo Salah"
              autoCapitalize="words"
              autoCorrect={false}
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
              error={errors.fullName}
            />
          </View>

          <View className="mb-4">
            <TextField
              ref={emailRef}
              label="Email"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email)
                  setErrors((e) => ({ ...e, email: undefined }));
              }}
              placeholder="mo@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              error={errors.email}
            />
          </View>

          <View className="mb-6">
            <TextField
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password)
                  setErrors((e) => ({ ...e, password: undefined }));
              }}
              placeholder="Min 8 characters"
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={handleContinue}
              error={errors.password}
              right={
                <Pressable
                  onPress={() => setShowPw((p) => !p)}
                  accessibilityLabel={
                    showPw ? 'Hide password' : 'Show password'
                  }
                  accessibilityRole="button"
                >
                  <Text className="text-sm font-semibold text-tertiary">
                    {showPw ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              }
            />
          </View>

          <Btn
            label={signup.isPending ? 'Creating account...' : 'Continue'}
            full
            onPress={handleContinue}
            disabled={!canSubmit || signup.isPending}
          />

          <View className="flex-row justify-center mt-6 mb-8">
            <Text className="text-base text-secondary tracking-[-0.1px]">
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text className="text-base font-bold text-ink">Log in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
