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
import Header from '@/components/ui/Header';
import Btn from '@/components/ui/Btn';
import TextField from '@/components/forms/TextField';
import { useChangePassword } from '@/lib/hooks/useAuth';
import { toast } from '@/lib/stores/toast';

const MIN_PASSWORD_LENGTH = 8;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const change = useChangePassword();

  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errors, setErrors] = useState<{
    current?: string;
    newPw?: string;
    confirm?: string;
  }>({});

  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const validate = () => {
    const e: typeof errors = {};
    if (!current) e.current = 'Current password is required';
    if (!newPw) e.newPw = 'New password is required';
    else if (newPw.length < MIN_PASSWORD_LENGTH)
      e.newPw = `Must be at least ${MIN_PASSWORD_LENGTH} characters`;
    else if (newPw === current) e.newPw = 'Must differ from current password';
    if (!confirm) e.confirm = 'Please confirm your password';
    else if (confirm !== newPw) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canSubmit =
    current.length > 0 &&
    newPw.length >= MIN_PASSWORD_LENGTH &&
    confirm.length > 0;

  const handleSubmit = () => {
    if (change.isPending) return;
    if (!validate()) return;
    change.mutate(
      { currentPassword: current, newPassword: newPw },
      {
        onSuccess: () => {
          toast.success('Password changed');
          router.back();
        },
        onError: () =>
          setErrors((e) => ({
            ...e,
            current: 'Incorrect current password',
          })),
      },
    );
  };

  const toggleBtn = (show: boolean, toggle: () => void) => (
    <Pressable
      onPress={toggle}
      accessibilityLabel={show ? 'Hide password' : 'Show password'}
      accessibilityRole="button"
    >
      <Text className="text-[12px] font-semibold text-tertiary">
        {show ? 'Hide' : 'Show'}
      </Text>
    </Pressable>
  );

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
          <Header title="Change Password" onBack={() => router.back()} />

          <View className="mb-4">
            <TextField
              label="Current Password"
              value={current}
              onChangeText={(t) => {
                setCurrent(t);
                if (errors.current)
                  setErrors((e) => ({ ...e, current: undefined }));
              }}
              placeholder="Enter current password"
              secureTextEntry={!showCurrent}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              returnKeyType="next"
              onSubmitEditing={() => newRef.current?.focus()}
              blurOnSubmit={false}
              error={errors.current}
              right={toggleBtn(showCurrent, () => setShowCurrent((p) => !p))}
            />
          </View>

          <View className="mb-4">
            <TextField
              ref={newRef}
              label="New Password"
              value={newPw}
              onChangeText={(t) => {
                setNewPw(t);
                if (errors.newPw)
                  setErrors((e) => ({ ...e, newPw: undefined }));
              }}
              placeholder="Min 8 characters"
              secureTextEntry={!showNew}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              blurOnSubmit={false}
              error={errors.newPw}
              right={toggleBtn(showNew, () => setShowNew((p) => !p))}
            />
          </View>

          <View className="mb-6">
            <TextField
              ref={confirmRef}
              label="Confirm New Password"
              value={confirm}
              onChangeText={(t) => {
                setConfirm(t);
                if (errors.confirm)
                  setErrors((e) => ({ ...e, confirm: undefined }));
              }}
              placeholder="Re-enter new password"
              secureTextEntry={!showNew}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              error={errors.confirm}
            />
          </View>

          <Btn
            label={change.isPending ? 'Updating...' : 'Update password'}
            full
            onPress={handleSubmit}
            disabled={!canSubmit || change.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
