import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/ui/Header";
import Btn from "@/components/ui/Btn";
import TextField from "@/components/forms/TextField";
import AddressAutocomplete from "@/components/forms/AddressAutocomplete";
import LocationPicker from "@/components/forms/LocationPicker";
import { useSignupStep2 } from "@/lib/hooks/useAuth";
import { useOnboardingStore } from "@/lib/stores/onboarding";
import { toast } from "@/lib/stores/toast";
import type { AddressParts } from "@/lib/api/places";

const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;
const NAME_RE = /^[a-zA-ZÀ-ɏ\s'\-\.0-9&]+$/;

export default function SignupStep2Screen() {
	const router = useRouter();
	const signup = useSignupStep2();
	const { draft, patchDraft, clearStep, clearDraft } = useOnboardingStore();

	const handleSkip = () => {
		clearDraft();
		router.replace("/(app)/(tabs)/today");
	};

	const [shopName, setShopName] = useState(draft.step2?.shopName ?? "");
	const [phone, setPhone] = useState(draft.step2?.phone ?? "");
	const [streetAddress, setStreetAddress] = useState(draft.step2?.streetAddress ?? "");
	const [city, setCity] = useState(draft.step2?.city ?? "");
	const [state, setState] = useState(draft.step2?.state ?? "");
	const [zipCode, setZipCode] = useState(draft.step2?.zipCode ?? "");
	const [latitude, setLatitude] = useState<number | null>(draft.step2?.latitude ?? null);
	const [longitude, setLongitude] = useState<number | null>(draft.step2?.longitude ?? null);
	const [errors, setErrors] = useState<{
		shopName?: string;
		phone?: string;
		streetAddress?: string;
		city?: string;
		state?: string;
		zipCode?: string;
		location?: string;
	}>({});

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

	const phoneRef = useRef<TextInput>(null);
	const addressRef = useRef<TextInput>(null);
	const cityRef = useRef<TextInput>(null);
	const stateRef = useRef<TextInput>(null);
	const zipRef = useRef<TextInput>(null);

	const clearError = (field: keyof typeof errors) => {
		if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
	};

	const validate = () => {
		const e: typeof errors = {};

		const trimShop = shopName.trim();
		const trimPhone = phone.trim();
		const trimAddr = streetAddress.trim();
		const trimCity = city.trim();
		const trimState = state.trim();
		const trimZip = zipCode.trim();

		if (!trimShop) e.shopName = "Shop name is required";
		else if (trimShop.length < 2) e.shopName = "Must be at least 2 characters";

		if (!trimPhone) e.phone = "Phone number is required";
		else if (!PHONE_RE.test(trimPhone)) e.phone = "Enter a valid phone number";

		if (!trimAddr) e.streetAddress = "Street address is required";
		else if (trimAddr.length < 5) e.streetAddress = "Enter a full street address";

		if (!trimCity) e.city = "City is required";
		else if (!/^[a-zA-ZÀ-ɏ\s'\-\.]+$/.test(trimCity)) e.city = "City can only contain letters";

		if (!trimState) e.state = "State is required";
		else if (trimState.length < 2) e.state = "Use state abbreviation";

		if (!trimZip) e.zipCode = "ZIP code is required";
		else if (!ZIP_RE.test(trimZip)) e.zipCode = "Enter a valid ZIP code";

		if (latitude === null || longitude === null) {
			e.location = "Pin your shop on the map";
		}

		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const canSubmit =
		shopName.trim().length > 0 &&
		phone.trim().length > 0 &&
		streetAddress.trim().length > 0 &&
		city.trim().length > 0 &&
		state.trim().length > 0 &&
		zipCode.trim().length > 0 &&
		latitude !== null &&
		longitude !== null;

	const handleContinue = () => {
		if (signup.isPending) return;
		if (!validate()) return;

		const body = {
			shopName: shopName.trim(),
			phone: phone.trim(),
			streetAddress: streetAddress.trim(),
			city: city.trim(),
			state: state.trim().toUpperCase(),
			zipCode: zipCode.trim(),
			latitude: latitude as number,
			longitude: longitude as number,
		};

		patchDraft("step2", body);

		signup.mutate(body, {
			onSuccess: () => {
				setShopName("");
				setPhone("");
				setStreetAddress("");
				setCity("");
				setState("");
				setZipCode("");
				setLatitude(null);
				setLongitude(null);
				setErrors({});
				clearStep("step2");
				router.push("/(auth)/signup/step3");
			},
			onError: () => toast.error("Save failed. Please try again."),
		});
	};

	return (
		<SafeAreaView className="flex-1 bg-surface">
			<KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
				<ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
					<Header
						title=""
						onBack={() => router.back()}
						right={
							<Pressable onPress={handleSkip} hitSlop={8}>
								<Text className="text-md font-semibold text-tertiary tracking-[-0.1px]">Skip</Text>
							</Pressable>
						}
					/>

					{/* Progress bar */}
					<View className="flex-row gap-[6px] mb-2 mt-2">
						{[0, 1, 2, 3].map((i) => (
							<View key={i} className={`flex-1 h-[3px] rounded-full ${i <= 1 ? "bg-ink" : "bg-separator-opaque"}`} />
						))}
					</View>
					<Text className="text-xs font-semibold text-tertiary tracking-[0.6px] uppercase mb-5">Step 2 of 4</Text>

					<Text className="text-3xl font-extrabold text-ink tracking-[-0.5px] mb-5">Shop Details</Text>

					<View className="mb-4">
						<TextField
							label="Shop Name"
							value={shopName}
							onChangeText={(t) => {
								setShopName(t);
								clearError("shopName");
							}}
							placeholder="Mo's Barbershop"
							autoCapitalize="words"
							autoCorrect={false}
							autoComplete="organization"
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
							onChangeText={(t) => {
								setPhone(t);
								clearError("phone");
							}}
							placeholder="(555) 123-4567"
							keyboardType="phone-pad"
							autoComplete="tel"
							textContentType="telephoneNumber"
							returnKeyType="next"
							onSubmitEditing={() => addressRef.current?.focus()}
							blurOnSubmit={false}
							error={errors.phone}
						/>
					</View>

					<View className="mb-4">
						<AddressAutocomplete
							ref={addressRef}
							label="Street Address"
							value={streetAddress}
							onChangeText={(t) => {
								setStreetAddress(t);
								clearError("streetAddress");
							}}
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
							onChangeText={(t) => {
								setCity(t);
								clearError("city");
							}}
							placeholder="Dallas"
							half
							autoCapitalize="words"
							autoComplete="postal-address-locality"
							textContentType="addressCity"
							returnKeyType="next"
							onSubmitEditing={() => stateRef.current?.focus()}
							blurOnSubmit={false}
							error={errors.city}
						/>
						<TextField
							ref={stateRef}
							label="State"
							value={state}
							onChangeText={(t) => {
								setState(t);
								clearError("state");
							}}
							placeholder="TX"
							half
							autoCapitalize="characters"
							autoComplete="postal-address-region"
							textContentType="addressState"
							returnKeyType="next"
							onSubmitEditing={() => zipRef.current?.focus()}
							blurOnSubmit={false}
							error={errors.state}
						/>
					</View>

					<View className="mb-6">
						<TextField
							ref={zipRef}
							label="ZIP Code"
							value={zipCode}
							onChangeText={(t) => {
								setZipCode(t);
								clearError("zipCode");
							}}
							placeholder="75201"
							keyboardType="number-pad"
							autoComplete="postal-code"
							textContentType="postalCode"
							returnKeyType="done"
							error={errors.zipCode}
						/>
					</View>

					{/* Map picker */}
					<Text className="text-base font-semibold text-secondary tracking-[-0.1px] mb-[6px]">Pin your shop on the map</Text>
					<Text className="text-sm text-tertiary leading-[17px] tracking-[-0.05px] mb-[10px]">Drop a pin so clients see exact directions. We'll save the lat/lng with your address.</Text>
					<LocationPicker
						latitude={latitude}
						longitude={longitude}
						onChange={(lat, lng, parts) => {
							setLatitude(lat);
							setLongitude(lng);
							if (parts) applyAddressParts(parts);
							clearError("streetAddress");
						}}
					/>
					{errors.location && <Text className="text-sm text-red mt-1 tracking-[-0.1px]">{errors.location}</Text>}

					<View className="flex-row gap-3 mt-2 mb-8">
						<View className="flex-1">
							<Btn label="Back" variant="ghost" full onPress={() => router.back()} />
						</View>
						<View className="flex-[2]">
							<Btn label={signup.isPending ? "Saving..." : "Continue"} full onPress={handleContinue} disabled={!canSubmit || signup.isPending} />
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
