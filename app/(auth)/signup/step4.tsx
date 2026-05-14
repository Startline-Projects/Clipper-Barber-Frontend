import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Btn from '@/components/ui/Btn';
import CategorySelector from '@/components/forms/CategorySelector';
import { useColors } from '@/lib/theme/colors';
import { useSignupStep4 } from '@/lib/hooks/useAuth';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { toast } from '@/lib/stores/toast';
import { BarberCategoryTag } from '@/lib/schemas/enums';
import type { BarberCategoryTag as BarberCategoryTagType } from '@/lib/constants/enums';

/** Coerce a persisted draft array back into valid enum values. */
function parseDraftCategories(raw?: string[]): BarberCategoryTagType[] {
  if (!raw) return [];
  return raw.filter(
    (v): v is BarberCategoryTagType => BarberCategoryTag.safeParse(v).success,
  );
}

export default function SignupStep4Screen() {
  const router = useRouter();
  const colors = useColors();
  const signup = useSignupStep4();
  const { draft, patchDraft, clearDraft } = useOnboardingStore();

  const [categories, setCategories] = useState<BarberCategoryTagType[]>(() =>
    parseDraftCategories(draft.step4?.categories),
  );

  const finish = (next: BarberCategoryTagType[]) => {
    if (signup.isPending) return;
    patchDraft('step4', { categories: next });
    signup.mutate(
      { categories: next },
      {
        onSuccess: () => {
          clearDraft();
          router.replace('/(app)/(tabs)/today');
        },
        onError: () => toast.error('Save failed. Please try again.'),
      },
    );
  };

  const handleSkip = () => finish([]);
  const handleFinish = () => finish(categories);

  const hasSelection = categories.length > 0;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.surface }}>
      <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
        <Header
          title=""
          onBack={() => router.back()}
          right={
            <Pressable onPress={handleSkip} hitSlop={8}>
              <Text className="text-md font-semibold text-tertiary tracking-[-0.1px]">
                Skip
              </Text>
            </Pressable>
          }
        />

        {/* Progress bar */}
        <View className="flex-row gap-[6px] mb-2 mt-2">
          {[0, 1, 2, 3].map((i) => (
            <View key={i} className="flex-1 h-[3px] rounded-full bg-ink" />
          ))}
        </View>
        <Text className="text-xs font-semibold text-tertiary tracking-[0.6px] uppercase mb-5">
          Step 4 of 4 · Optional
        </Text>

        <Text className="text-3xl font-extrabold text-ink tracking-[-0.5px] mb-2">
          Your Specialties
        </Text>
        <Text className="text-base text-tertiary leading-[21px] tracking-[-0.1px] mb-6">
          Pick the services and specialties that describe your work. Clients
          use these to find you. You can change them anytime from your profile.
        </Text>

        <CategorySelector value={categories} onChange={setCategories} />

        <Text className="text-sm text-quaternary mt-4 tracking-[-0.1px]">
          {hasSelection
            ? `${categories.length} selected`
            : 'No specialties selected yet'}
        </Text>

        <View className="flex-row gap-3 mt-8 mb-4">
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

        <Text className="text-sm text-quaternary text-center mb-8 tracking-[-0.1px]">
          Free forever — no fees, no commission
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
