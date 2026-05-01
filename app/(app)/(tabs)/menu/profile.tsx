import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Header from '@/components/ui/Header';
import Section from '@/components/ui/Section';
import Btn from '@/components/ui/Btn';
import TextField from '@/components/forms/TextField';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import { useProfile, useUpdateProfile } from '@/lib/hooks/useProfile';
import type { RNFile } from '@/lib/api/auth';

const NAME_RE = /^[a-zA-ZÀ-ɏЀ-ӿ؀-ۿ\s'\-\.]+$/;
const SHOP_NAME_RE = /^[a-zA-ZÀ-ɏ\s'\-\.0-9&]+$/;
const PHONE_RE = /^\(\d{3}\) \d{3}-\d{4}$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;
const CITY_RE = /^[a-zA-ZÀ-ɏ\s'\-\.]+$/;
const STATE_RE = /^[a-zA-Z]+$/;
const IG_RE = /^@?[a-zA-Z0-9._]{1,30}$/;

function formatUSPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

type FieldErrors = {
  fullName?: string;
  shopName?: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bio?: string;
  instagram?: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data: profile, isLoading, isError, error, refetch } = useProfile();
  const update = useUpdateProfile();

  const [fullName, setFullName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [photo, setPhoto] = useState<RNFile | null>(null);
  const [photoPicker, setPhotoPicker] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const shopRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const addrRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);
  const zipRef = useRef<TextInput>(null);

  if (profile && !hydrated) {
    setFullName(profile.full_name ?? '');
    setShopName(profile.shop_name ?? '');
    setPhone(profile.phone ? formatUSPhone(profile.phone) : '');
    setStreetAddress(profile.street_address ?? '');
    setCity(profile.city ?? '');
    setState(profile.state ?? '');
    setZipCode(profile.zip_code ?? '');
    setBio(profile.bio ?? '');
    setInstagram(profile.instagram_handle ?? '');
    setHydrated(true);
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-5">
          <Header title="Edit Profile" onBack={() => router.back()} />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.tertiary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-5">
          <Header title="Edit Profile" onBack={() => router.back()} />
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[15px] text-tertiary text-center mb-2">
            Could not load profile
          </Text>
          {/* DEBUG: remove this error text once loading issue is resolved */}
          <Text className="text-[12px] text-quaternary text-center mb-4" selectable>
            {error instanceof Error ? error.message : JSON.stringify(error)}
          </Text>
          <Pressable onPress={() => refetch()}>
            <Text className="text-[14px] font-semibold text-blue">Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const dirty =
    fullName !== (profile.full_name ?? '') ||
    shopName !== (profile.shop_name ?? '') ||
    phone !== (profile.phone ?? '') ||
    streetAddress !== (profile.street_address ?? '') ||
    city !== (profile.city ?? '') ||
    state !== (profile.state ?? '') ||
    zipCode !== (profile.zip_code ?? '') ||
    bio !== (profile.bio ?? '') ||
    instagram !== (profile.instagram_handle ?? '') ||
    photo !== null;

  const clearError = (field: keyof FieldErrors) => {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const e: FieldErrors = {};
    const trimName = fullName.trim();
    const trimShop = shopName.trim();
    const trimPhone = phone.trim();
    const trimAddr = streetAddress.trim();
    const trimCity = city.trim();
    const trimState = state.trim();
    const trimZip = zipCode.trim();
    const trimBio = bio.trim();
    const trimIg = instagram.trim();

    if (!trimName) e.fullName = 'Full name is required';
    else if (trimName.length < 2) e.fullName = 'Name must be at least 2 characters';
    else if (!NAME_RE.test(trimName)) e.fullName = 'Name can only contain letters';

    if (!trimShop) e.shopName = 'Shop name is required';
    else if (trimShop.length < 2) e.shopName = 'Must be at least 2 characters';
    else if (!SHOP_NAME_RE.test(trimShop)) e.shopName = 'Contains invalid characters';

    if (!trimPhone) e.phone = 'Phone number is required';
    else if (!PHONE_RE.test(trimPhone)) e.phone = 'Enter a valid US number: (555) 123-4567';

    if (!trimAddr) e.streetAddress = 'Street address is required';
    else if (trimAddr.length < 5) e.streetAddress = 'Enter a full street address';

    if (!trimCity) e.city = 'City is required';
    else if (!CITY_RE.test(trimCity)) e.city = 'City can only contain letters';

    if (!trimState) e.state = 'State is required';
    else if (!STATE_RE.test(trimState)) e.state = 'Letters only';
    else if (trimState.length !== 2) e.state = 'Use 2-letter abbreviation';

    if (!trimZip) e.zipCode = 'ZIP code is required';
    else if (!ZIP_RE.test(trimZip)) e.zipCode = 'Enter a valid ZIP code';

    if (trimBio.length > 300) e.bio = 'Bio must be under 300 characters';

    if (trimIg && !IG_RE.test(trimIg)) e.instagram = 'Enter a valid Instagram handle';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (update.isPending) return;
    if (!validate()) return;
    update.mutate(
      {
        fullName: fullName.trim(),
        shopName: shopName.trim(),
        phone: phone.trim(),
        streetAddress: streetAddress.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zipCode: zipCode.trim(),
        bio: bio.trim() || undefined,
        instagramHandle: instagram.trim().replace(/^@/, '') || undefined,
        photo: photo ?? undefined,
      },
      { onSuccess: () => router.back() },
    );
  };

  const pickFromLibrary = async () => {
    setPhotoPicker(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      const ext = a.uri.split('.').pop() ?? 'jpg';
      setPhoto({ uri: a.uri, type: a.mimeType ?? `image/${ext}`, name: `profile.${ext}` });
    }
  };

  const takePhoto = async () => {
    setPhotoPicker(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      const ext = a.uri.split('.').pop() ?? 'jpg';
      setPhoto({ uri: a.uri, type: a.mimeType ?? `image/${ext}`, name: `profile.${ext}` });
    }
  };

  const photoUri = photo?.uri ?? profile.profile_photo_url;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
          <Header
            title="Edit Profile"
            onBack={() => router.back()}
            right={
              dirty ? (
                <Pressable onPress={handleSave}>
                  <Text className="text-[15px] font-bold text-blue tracking-[-0.2px]">
                    Save
                  </Text>
                </Pressable>
              ) : undefined
            }
          />

          {/* Photo */}
          <View className="items-center mb-xl">
            <Pressable onPress={() => setPhotoPicker(true)} className="relative">
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <Avatar name={fullName || '?'} size={96} />
              )}
              <View className="absolute -bottom-[2px] -right-[2px] w-8 h-8 rounded-full bg-ink border-[3px] border-surface items-center justify-center">
                <Icon name="camera" size={14} color={colors.bg} />
              </View>
            </Pressable>
            <Pressable onPress={() => setPhotoPicker(true)} className="mt-3">
              <Text className="text-[14px] font-semibold text-blue tracking-[-0.1px]">
                Change photo
              </Text>
            </Pressable>
          </View>

          <Section title="Identity">
            <View className="mb-4">
              <TextField
                label="Your Name"
                value={fullName}
                onChangeText={(t) => { setFullName(t); clearError('fullName'); }}
                placeholder="Mo Alomari"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => shopRef.current?.focus()}
                blurOnSubmit={false}
                error={errors.fullName}
              />
            </View>
            <View className="mb-4">
              <TextField
                ref={shopRef}
                label="Barber Shop Name"
                value={shopName}
                onChangeText={(t) => { setShopName(t); clearError('shopName'); }}
                placeholder="Mo's Barbershop"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                blurOnSubmit={false}
                error={errors.shopName}
              />
            </View>
            <View className="mb-4">
              <TextField
                ref={phoneRef}
                label="Phone"
                value={phone}
                onChangeText={(t) => { setPhone(formatUSPhone(t)); clearError('phone'); }}
                placeholder="(555) 123-4567"
                maxLength={14}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                returnKeyType="next"
                onSubmitEditing={() => addrRef.current?.focus()}
                blurOnSubmit={false}
                error={errors.phone}
              />
            </View>
          </Section>

          <Section title="Location">
            <View className="mb-4">
              <TextField
                ref={addrRef}
                label="Street Address"
                value={streetAddress}
                onChangeText={(t) => { setStreetAddress(t); clearError('streetAddress'); }}
                placeholder="123 Main Street"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => cityRef.current?.focus()}
                blurOnSubmit={false}
                error={errors.streetAddress}
              />
            </View>
            <View className="flex-row gap-3 mb-4">
              <TextField
                ref={cityRef}
                label="City"
                value={city}
                onChangeText={(t) => { setCity(t); clearError('city'); }}
                placeholder="Dallas"
                half
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => stateRef.current?.focus()}
                blurOnSubmit={false}
                error={errors.city}
              />
              <TextField
                ref={stateRef}
                label="State"
                value={state}
                onChangeText={(t) => { setState(t.replace(/[^a-zA-Z]/g, '')); clearError('state'); }}
                placeholder="TX"
                half
                maxLength={2}
                autoCapitalize="characters"
                returnKeyType="next"
                onSubmitEditing={() => zipRef.current?.focus()}
                blurOnSubmit={false}
                error={errors.state}
              />
            </View>
            <View className="mb-4">
              <TextField
                ref={zipRef}
                label="ZIP Code"
                value={zipCode}
                onChangeText={(t) => { setZipCode(t); clearError('zipCode'); }}
                placeholder="75201"
                keyboardType="number-pad"
                error={errors.zipCode}
              />
            </View>

            {/* Map placeholder */}
            <View className="w-full h-[184px] rounded-md overflow-hidden border-[1.5px] border-separator-opaque mb-4 bg-separator-opaque items-center justify-center">
              <Icon name="location" size={36} color={colors.red} />
              <Text className="text-[12px] text-tertiary mt-2">Map coming soon</Text>
            </View>
          </Section>

          <Section title="About">
            <View className="mb-4">
              <TextField
                label="Bio"
                value={bio}
                onChangeText={(t) => { setBio(t); clearError('bio'); }}
                placeholder="Tell clients about your style, specialties, and shop vibe."
                multiline
                numberOfLines={3}
                error={errors.bio}
              />
            </View>
            <View className="mb-4">
              <TextField
                label="Instagram"
                value={instagram}
                onChangeText={(t) => { setInstagram(t); clearError('instagram'); }}
                placeholder="@mo_cuts"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.instagram}
              />
            </View>
          </Section>

          <Btn
            label={update.isPending ? 'Saving...' : dirty ? 'Save Changes' : 'Saved'}
            full
            disabled={!dirty || update.isPending}
            onPress={handleSave}
          />
          <View className="mt-2 mb-8">
            <Btn label="Cancel" variant="ghost" full onPress={() => router.back()} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Photo picker sheet */}
      <Modal visible={photoPicker} transparent animationType="slide" onRequestClose={() => setPhotoPicker(false)}>
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setPhotoPicker(false)}>
          <Pressable className="bg-surface rounded-t-3xl px-5 pt-4 pb-8" onPress={() => {}}>
            <View className="w-10 h-1 rounded-full bg-separator-opaque self-center mb-[18px]" />
            <Text className="text-[22px] font-extrabold text-ink tracking-[-0.5px]">
              Profile photo
            </Text>
            <Text className="text-[13px] text-secondary tracking-[-0.1px] mt-1 mb-[18px]">
              Choose a clear headshot or your shop logo.
            </Text>
            <View className="gap-2">
              <Pressable
                onPress={takePhoto}
                className="flex-row items-center gap-3 px-4 py-[14px] rounded-md border-[1.5px] border-separator-opaque"
              >
                <Icon name="camera" size={20} color={colors.ink} />
                <Text className="text-[15px] font-semibold text-ink tracking-[-0.2px]">
                  Take photo
                </Text>
              </Pressable>
              <Pressable
                onPress={pickFromLibrary}
                className="flex-row items-center gap-3 px-4 py-[14px] rounded-md border-[1.5px] border-separator-opaque"
              >
                <Icon name="image" size={20} color={colors.ink} />
                <Text className="text-[15px] font-semibold text-ink tracking-[-0.2px]">
                  Choose from library
                </Text>
              </Pressable>
              {(photoUri) && (
                <Pressable
                  onPress={() => {
                    setPhoto(null);
                    setPhotoPicker(false);
                  }}
                  className="flex-row items-center gap-3 px-4 py-[14px] rounded-md border-[1.5px] border-red/30"
                >
                  <Icon name="trash" size={20} color={colors.red} />
                  <Text className="text-[15px] font-semibold text-red tracking-[-0.2px]">
                    Remove photo
                  </Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
