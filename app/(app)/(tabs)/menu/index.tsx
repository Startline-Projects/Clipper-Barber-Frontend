import { useCallback, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/ui/Header";
import Section from "@/components/ui/Section";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/Icon";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SetupAlerts from "@/components/ui/SetupAlerts";
import { useColors } from "@/lib/theme/colors";
import { useProfile } from "@/lib/hooks/useProfile";
import { useReviewsAnalytics } from "@/lib/hooks/useReviews";
import { useLogout } from "@/lib/hooks/useAuth";
import { useAuthStore } from "@/lib/stores/auth.store";
import { resendVerification } from "@/lib/api/auth";
import type { IconName } from "@/components/ui/Icon";

interface MenuItem {
	label: string;
	sub: string;
	icon: IconName;
	route?: string;
	onPress?: () => void;
	warn?: boolean;
	danger?: boolean;
}

export default function MenuScreen() {
	const router = useRouter();
	const colors = useColors();
	const { data: profile, refetch: refetchProfile } = useProfile();
	const { data: analytics, refetch: refetchAnalytics } = useReviewsAnalytics();
	const logout = useLogout();
	const email = useAuthStore((s) => s.email);
	const emailVerified = useAuthStore((s) => s.emailVerified);
	const [resending, setResending] = useState(false);

	const handleVerifyEmail = async () => {
		if (emailVerified === true) {
			Alert.alert("Email verified", "Your email is already verified.");
			return;
		}
		const target = email ?? profile?.email;
		if (!target) {
			Alert.alert("Missing email", "No email on file for this account.");
			return;
		}
		try {
			setResending(true);
			await resendVerification({ email: target });
			Alert.alert(
				"Verification email sent",
				`We sent a verification link to ${target}. Tap it to verify your address.`,
			);
		} catch (e) {
			const msg = (e as Error)?.message ?? "Please try again.";
			Alert.alert("Could not send", msg);
		} finally {
			setResending(false);
		}
	};

	const [refreshing, setRefreshing] = useState(false);
	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await Promise.all([refetchProfile(), refetchAnalytics()]);
		setRefreshing(false);
	}, [refetchProfile, refetchAnalytics]);

	const avgRating = analytics?.averageRating ?? 0;
	const totalReviews = analytics?.totalReviews ?? 0;

	const handleLogout = () => {
		Alert.alert("Log out?", "You'll be signed out of Clipper.", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Log out",
				style: "destructive",
				onPress: () => logout.mutate(undefined),
			},
		]);
	};

	const items: MenuItem[] = [
		{ label: "Profile", sub: "Name, photo, bio", icon: "user", route: "/(app)/(tabs)/menu/profile" },
		{ label: "Schedule", sub: "Hours & availability", icon: "clock", route: "/(app)/(tabs)/menu/schedule" },
		{ label: "Services", sub: "Types & pricing", icon: "scissors", route: "/(app)/(tabs)/menu/services" },
		{ label: "Reviews", sub: `${totalReviews} reviews · ${avgRating.toFixed(1)} avg`, icon: "star", route: "/(app)/(tabs)/menu/reviews" },
		{ label: "Income", sub: "Earnings & export", icon: "dollar", route: "/(app)/(tabs)/menu/income" },
		{ label: "Clients", sub: "Client management", icon: "user", route: "/(app)/(tabs)/menu/clients/" },
		{ label: "Payments & Payouts", sub: profile?.stripeConnected ? "Stripe connected" : "Set up Stripe", icon: "card", route: "/(app)/(tabs)/menu/payments", warn: !profile?.stripeConnected },
		{
			label: "No-Show Charge",
			sub: profile?.noShowChargeEnabled
				? `Enabled · $${profile.noShowChargeAmountUsd ?? 0} fee`
				: "Not set up",
			icon: "shield",
			route: "/(app)/(tabs)/menu/no-show-settings",
		},
		{
			label: "No-Show Payments",
			sub: "Track owed & paid no-show fees",
			icon: "dollar",
			route: "/(app)/(tabs)/menu/no-shows",
		},
		{
			label: "In-House Services",
			sub: profile?.inHouseServices ? "Enabled" : "Disabled",
			icon: "scissors",
			route: "/(app)/(tabs)/menu/in-house-services",
		},
		{ label: "Notification Settings", sub: "Push preferences", icon: "bell", route: "/(app)/(tabs)/menu/notification-settings" },
		{
			label: "Verify Email",
			sub: resending
				? "Sending verification email…"
				: emailVerified === true
					? "Email verified"
					: "Send verification link to your email",
			icon: "shield",
			onPress: handleVerifyEmail,
			warn: emailVerified === false,
		},
		{ label: "Change Password", sub: "Update your password", icon: "shield", route: "/(app)/(tabs)/menu/change-password" },
	];

	return (
		<SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
			<ScrollView className="flex-1 px-5" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tertiary} />}>
				<Header title="More" />

				{/* Profile header */}
				<Pressable onPress={() => router.push("/(app)/(tabs)/menu/profile")} className="items-center pb-6">
					<Avatar name={profile?.full_name ?? "?"} size={68} uri={profile?.profile_photo_url ?? undefined} />
					<Text className="text-2xl font-bold text-ink tracking-[-0.4px] mt-3 mb-[2px]">{profile?.full_name ?? "—"}</Text>
					<Text className="text-base text-tertiary tracking-[-0.1px]">
						{profile?.shop_name ?? ""}
						{profile?.city ? ` · ${profile.city}` : ""}
					</Text>
					<Pressable onPress={() => router.push("/(app)/(tabs)/menu/reviews")} className="flex-row items-center gap-1 mt-1">
						<Icon name="star" size={12} color={colors.yellow} />
						<Text className="text-md text-secondary font-medium">
							{avgRating.toFixed(1)} · {totalReviews} reviews
						</Text>
					</Pressable>
				</Pressable>

				{/* Setup alerts */}
				<SetupAlerts
					stripeConnected={profile?.stripeConnected}
					locationSet={profile?.locationSet}
					className="mb-4"
				/>

				{/* Nav list */}
				<Card elevated className="p-0 overflow-hidden">
					{items.map((it, i) => (
						<Pressable
							key={it.label}
							onPress={() => (it.onPress ? it.onPress() : it.route && router.push(it.route as any))}
							className={`flex-row items-center gap-[14px] px-4 py-[15px] ${i < items.length - 1 ? "border-b border-separator" : ""}`}>
							<View className={`w-[34px] h-[34px] rounded-xs items-center justify-center ${it.warn ? "bg-orange/12" : "bg-bg"}`}>
								<Icon name={it.icon} size={18} color={it.warn ? colors.orange : colors.secondary} />
							</View>
							<View className="flex-1">
								<Text className="text-lg font-semibold text-ink tracking-[-0.2px]">{it.label}</Text>
								<Text className={`text-base mt-[1px] ${it.warn ? "text-orange" : "text-tertiary"}`}>{it.sub}</Text>
							</View>
							<Icon name="chevron" size={16} color={colors.quaternary} />
						</Pressable>
					))}

					{/* Logout row */}
					<Pressable onPress={handleLogout} className="flex-row items-center gap-[14px] px-4 py-[15px]">
						<View className="w-[34px] h-[34px] rounded-xs bg-red/10 items-center justify-center">
							<Icon name="back" size={18} color={colors.red} />
						</View>
						<View className="flex-1">
							<Text className="text-lg font-semibold text-red tracking-[-0.2px]">Log out</Text>
							<Text className="text-base text-red/70 mt-[1px]">Sign out of Clipper</Text>
						</View>
					</Pressable>
				</Card>

				{/* Appearance */}
				<View className="mt-6 bg-surface rounded-2xl overflow-hidden">
					<Text className="text-xs font-semibold text-tertiary uppercase tracking-wider px-4 pt-4 pb-2">Appearance</Text>
					<View className="px-4">
						<ThemeToggle />
					</View>
				</View>

				<Text className="text-xs text-quaternary text-center mt-6 mb-8 tracking-[0.2px]">Clipper v1.0 · Free forever</Text>
			</ScrollView>
		</SafeAreaView>
	);
}
