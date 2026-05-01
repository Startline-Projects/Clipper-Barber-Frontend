import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Header from '@/components/ui/Header';
import Btn from '@/components/ui/Btn';
import TextField from '@/components/forms/TextField';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import { useSignupStep3 } from '@/lib/hooks/useAuth';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import type { RNFile } from '@/lib/api/auth';

const IG_RE = /^@?[a-zA-Z0-9._]{1,30}$/;

export default function SignupStep3Screen() {
  const router = useRouter();
  const colors = useColors();
  const signup = useSignupStep3();
  const { draft, patchDraft, clearDraft } = useOnboardingStore();

  const [photo, setPhoto] = useState<RNFile | null>(null);
  const [bio, setBio] = useState(draft.step3?.bio ?? '');
  const [instagram, setInstagram] = useState(
    draft.step3?.instagramHandle ?? '',
  );
  const [errors, setErrors] = useState<{
    bio?: string;
    instagram?: string;
  }>({});

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop() ?? 'jpg';
    setPhoto({
      uri: asset.uri,
      type: asset.mimeType ?? `image/${ext}`,
      name: `profile.${ext}`,
    });
  };

  const removePhoto = () => setPhoto(null);

  const validate = () => {
    const e: typeof errors = {};
    const trimBio = bio.trim();
    const trimIg = instagram.trim();

    if (trimBio.length > 300) e.bio = 'Bio must be under 300 characters';
    if (trimIg && !IG_RE.test(trimIg))
      e.instagram = 'Enter a valid Instagram handle';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFinish = () => {
    if (signup.isPending) return;
    if (!validate()) return;

    const trimBio = bio.trim();
    const trimIg = instagram.trim().replace(/^@/, '');

    patchDraft('step3', {
      bio: trimBio || undefined,
      instagramHandle: trimIg || undefined,
    });

    signup.mutate(
      {
        photo: photo ?? undefined,
        bio: trimBio || undefined,
        instagramHandle: trimIg || undefined,
      },
      {
        onSuccess: () => {
          clearDraft();
          router.replace('/(app)/(tabs)/today');
        },
        onError: () =>
          Alert.alert(
            'Save failed',
            'Something went wrong. Please try again.',
          ),
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

          {/* Progress bar */}
          <View className="flex-row gap-[6px] mb-2 mt-2">
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                className="flex-1 h-[3px] rounded-full bg-ink"
              />
            ))}
          </View>
          <Text className="text-[11px] font-semibold text-tertiary tracking-[0.6px] uppercase mb-5">
            Step 3 of 3
          </Text>

          <Text className="text-[22px] font-extrabold text-ink tracking-[-0.5px] mb-6">
            Your Profile
          </Text>

          {/* Photo picker */}
          <View className="items-center mb-6">
            <Pressable
              onPress={photo ? removePhoto : pickImage}
              accessibilityLabel={
                photo ? 'Remove profile photo' : 'Add profile photo'
              }
              accessibilityRole="button"
            >
              {photo ? (
                <View className="w-[88px] h-[88px] rounded-[30px] overflow-hidden">
                  <Image
                    source={{ uri: photo.uri }}
                    className="w-full h-full"
                  />
                  <View className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-ink items-center justify-center border-2 border-surface">
                    <Icon name="close" size={14} color="#FFF" />
                  </View>
                </View>
              ) : (
                <View className="w-[88px] h-[88px] rounded-[30px] bg-bg border-2 border-dashed border-quaternary items-center justify-center">
                  <Icon name="camera" size={28} color={colors.tertiary} />
                </View>
              )}
            </Pressable>
            <Pressable onPress={pickImage} className="mt-[10px]">
              <Text className="text-[13px] text-tertiary font-medium tracking-[-0.1px]">
                {photo ? 'Change photo' : 'Add a profile photo'}
              </Text>
            </Pressable>
          </View>

          <View className="mb-4">
            <TextField
              label="Bio (optional)"
              value={bio}
              onChangeText={(t) => {
                setBio(t);
                if (errors.bio)
                  setErrors((e) => ({ ...e, bio: undefined }));
              }}
              placeholder="Tell clients about your style"
              multiline
              numberOfLines={3}
              error={errors.bio}
            />
          </View>

          <View className="mb-6">
            <TextField
              label="Instagram (optional)"
              value={instagram}
              onChangeText={(t) => {
                setInstagram(t);
                if (errors.instagram)
                  setErrors((e) => ({ ...e, instagram: undefined }));
              }}
              placeholder="@mo_cuts"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              error={errors.instagram}
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Btn
                label="Back"
                variant="ghost"
                full
                onPress={() => router.back()}
              />
            </View>
            <View className="flex-[2]">
              <Btn
                label={signup.isPending ? 'Finishing...' : 'Get Started'}
                full
                onPress={handleFinish}
                disabled={signup.isPending}
              />
            </View>
          </View>

          <Text className="text-[12px] text-quaternary text-center mb-8 tracking-[-0.1px]">
            Free forever — no fees, no commission
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
