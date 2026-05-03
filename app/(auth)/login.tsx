import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/ui/Icon';
import Btn from '@/components/ui/Btn';
import TextField from '@/components/forms/TextField';
import Header from '@/components/ui/Header';
import { useLogin } from '@/lib/hooks/useAuth';
import { toast } from '@/lib/stores/toast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const passwordRef = useRef<TextInput>(null);

  const validate = () => {
    const e: typeof errors = {};
    const trimmed = email.trim();
    if (!trimmed) e.email = 'Email is required';
    else if (!EMAIL_RE.test(trimmed)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleLogin = () => {
    if (login.isPending) return;
    if (!validate()) return;
    login.mutate(
      { email: email.trim().toLowerCase(), password, role: 'barber' },
      {
        onError: () =>
          toast.error('Invalid email or password. Please try again.'),
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

          <View className="items-center mt-2 mb-7">
            <View className="w-14 h-14 rounded-[18px] overflow-hidden mb-[14px]">
              <LinearGradient
                colors={['#0A0A0A', '#2C2C2E']}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="scissors" size={26} color="#FFF" />
              </LinearGradient>
            </View>
            <Text className="text-[26px] font-extrabold text-ink tracking-[-0.6px]">
              Welcome back
            </Text>
            <Text className="text-[14px] text-tertiary mt-2 tracking-[-0.1px]">
              Log in to manage your chair
            </Text>
          </View>

          <View className="mb-4">
            <TextField
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

          <View className="mb-0">
            <TextField
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password)
                  setErrors((e) => ({ ...e, password: undefined }));
              }}
              placeholder="••••••••"
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              error={errors.password}
              right={
                <Pressable
                  onPress={() => setShowPw((p) => !p)}
                  accessibilityLabel={
                    showPw ? 'Hide password' : 'Show password'
                  }
                  accessibilityRole="button"
                >
                  <Text className="text-[12px] font-semibold text-tertiary tracking-[-0.1px]">
                    {showPw ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              }
            />
          </View>

          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            className="mt-3 mb-[18px]"
          >
            <Text className="text-[13px] font-semibold text-blue tracking-[-0.1px]">
              Forgot password?
            </Text>
          </Pressable>

          <Btn
            label={login.isPending ? 'Logging in...' : 'Log In'}
            full
            onPress={handleLogin}
            disabled={!canSubmit || login.isPending}
          />

          <View className="flex-row justify-center mt-7 mb-8">
            <Text className="text-[13px] text-secondary tracking-[-0.1px]">
              New to Clipper?{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/signup/step1')}>
              <Text className="text-[13px] font-bold text-ink">
                Create account
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
