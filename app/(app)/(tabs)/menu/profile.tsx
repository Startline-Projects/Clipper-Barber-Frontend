import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type BottomSheet from '@gorhom/bottom-sheet';
import PhotoPickerSheet from '@/components/sheets/PhotoPickerSheet';
import { pickImage } from '@/lib/utils/pick-image';
import Header from '@/components/ui/Header';
import Section from '@/components/ui/Section';
import Btn from '@/components/ui/Btn';
import TextField from '@/components/forms/TextField';
import AddressAutocomplete from '@/components/forms/AddressAutocomplete';
import LocationPicker from '@/components/forms/LocationPicker';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import { useProfile, useUpdateProfile } from '@/lib/hooks/useProfile';
import { getReadableError } from '@/lib/utils/get-readable-error';
import { toast } from '@/lib/stores/toast';
import type { RNFile } from '@/lib/api/auth';
import type { AddressParts } from '@/lib/api/places';

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
  location?: string;
  bio?: string;
  instagram?: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data: profile, isLoading, isError, error, refetch } = useProfile();
  const update = useUpdateProfile();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const [fullName, setFullName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [photo, setPhoto] = useState<RNFile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const photoSheetRef = useRef<BottomSheet>(null);
  const openPhotoSheet = useCallback(() => photoSheetRef.current?.snapToIndex(0), []);
  const closePhotoSheet = useCallback(() => photoSheetRef.current?.close(), []);
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
    setLatitude(profile.latitude);
    setLongitude(profile.longitude);
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
          <Text className="text-lg text-tertiary text-center mb-4">
            {getReadableError(error)}
          </Text>
          <Pressable onPress={() => refetch()}>
            <Text className="text-md font-semibold text-blue">Retry</Text>
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
    latitude !== profile.latitude ||
    longitude !== profile.longitude ||
    bio !== (profile.bio ?? '') ||
    instagram !== (profile.instagram_handle ?? '') ||
    photo !== null;

  const clearError = (field: keyof FieldErrors) => {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const applyAddressParts = (parts: AddressParts) => {
    if (parts.streetAddress) setStreetAddress(parts.streetAddress);
    if (parts.city) setCity(parts.city);
    if (parts.state) setState(parts.state);
    if (parts.zipCode) setZipCode(parts.zipCode);
    setLatitude(parts.latitude);
    setLongitude(parts.longitude);
    setErrors((e) => ({
      ...e,
      streetAddress: undefined,
      city: undefined,
      state: undefined,
      zipCode: undefined,
      location: undefined,
    }));
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

    if (latitude === null || longitude === null) {
      e.location = 'Pin your shop on the map';
    }

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
        latitude: latitude as number,
        longitude: longitude as number,
        bio: bio.trim() || undefined,
        instagramHandle: instagram.trim().replace(/^@/, '') || undefined,
        photo: photo ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success('Profile saved');
          router.back();
        },
      },
    );
  };

  const pickFromLibrary = async () => {
    closePhotoSheet();
    const file = await pickImage({ source: 'library', fileNamePrefix: 'profile' });
    if (file) setPhoto(file);
  };

  const takePhoto = async () => {
    closePhotoSheet();
    const file = await pickImage({ source: 'camera', fileNamePrefix: 'profile' });
    if (file) setPhoto(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    closePhotoSheet();
  };

  const photoUri = photo?.uri ?? profile.profile_photo_url;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tertiary} />}>
          <Header
            title="Edit Profile"
            onBack={() => router.back()}
            right={
              dirty ? (
                <Pressable onPress={handleSave}>
                  <Text className="text-lg font-bold text-blue tracking-[-0.2px]">
                    Save
                  </Text>
                </Pressable>
              ) : undefined
            }
          />

          {/* Photo */}
          <View className="items-center mb-xl">
            <Pressable onPress={openPhotoSheet} className="relative">
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
            <Pressable onPress={openPhotoSheet} className="mt-3">
              <Text className="text-md font-semibold text-blue tracking-[-0.1px]">
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
              <AddressAutocomplete
                ref={addrRef}
                label="Street Address"
                value={streetAddress}
                onChangeText={(t) => { setStreetAddress(t); clearError('streetAddress'); }}
                onPlaceSelected={applyAddressParts}
                placeholder="123 Main Street"
                returnKeyType="next"
                onSubmitEditing={() => cityRef.current?.focus()}
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

            <Text className="text-base font-semibold text-secondary tracking-[-0.1px] mb-[6px]">
              Pin your shop on the map
            </Text>
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onChange={(lat, lng, parts) => {
                setLatitude(lat);
                setLongitude(lng);
                if (parts) applyAddressParts(parts);
                clearError('location');
              }}
            />
            {errors.location && (
              <Text className="text-sm text-red mt-1 mb-2 tracking-[-0.1px]">
                {errors.location}
              </Text>
            )}
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

      <PhotoPickerSheet
        ref={photoSheetRef}
        hasPhoto={!!photoUri}
        onTakePhoto={takePhoto}
        onChooseLibrary={pickFromLibrary}
        onRemovePhoto={removePhoto}
        onCancel={closePhotoSheet}
      />
    </SafeAreaView>
  );
}
