import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/ui/Header";
import Section from "@/components/ui/Section";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import Avatar from "@/components/ui/Avatar";
import TypeBadge from "@/components/ui/TypeBadge";
import Icon from "@/components/ui/Icon";
import Divider from "@/components/ui/Divider";
import Toggle from "@/components/ui/Toggle";
import SetupAlerts from "@/components/ui/SetupAlerts";
import EmailVerificationBanner from "@/components/ui/EmailVerificationBanner";
import { formatUsd } from "@/lib/utils/format";
import { useColors } from "@/lib/theme/colors";
import { useConfirmBooking, useCancelBooking } from "@/lib/hooks/useBookings";
import { useUnreadCount } from "@/lib/hooks/useNotifications";
import { useAutoConfirm } from "@/lib/hooks/useAutoConfirm";
import { useBarberHome } from "@/lib/hooks/useBarberHome";
import { useProfile } from "@/lib/hooks/useProfile";
import { toast } from "@/lib/stores/toast";
import type {
	BarberHomePendingItem,
	BarberHomeScheduleItem,
} from "@/lib/api/home";
import type { ErrorBoundaryProps } from 'expo-router';
import { SkeletonBookingCard } from "@/components/feedback/Skeleton";

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-6 bg-bg">
      <Text className="text-[16px] font-semibold text-ink">Something went wrong</Text>
      <Text className="text-md text-secondary text-center">{error.message}</Text>
      <Pressable onPress={retry} className="px-6 py-3 bg-blue rounded-sm">
        <Text className="text-white font-semibold">Try again</Text>
      </Pressable>
    </View>
  );
}

const TYPE_BAR_COLORS: Record<string, string> = {
	regular: "#30D158",
	after_hours: "#FF9F0A",
	day_off: "#BF5AF2",
};

import { formatBookingTime, type BookingTimeFields } from "@/lib/utils/timezone";

type HomeItem = BarberHomePendingItem | BarberHomeScheduleItem;

function formatTime(b: BookingTimeFields) {
	// Always render in barber timezone; never the device's.
	const formatted = formatBookingTime(b);
	const m = /^([0-9]+:[0-9]+)\s*(AM|PM)$/i.exec(formatted);
	if (m) return { time: m[1], ampm: m[2].toUpperCase() };
	return { time: formatted, ampm: "" };
}

function joinedServiceName(b: HomeItem): string {
	if (b.services && b.services.length > 1) {
		return b.services.map((s) => s.name).join(" + ");
	}
	return b.service?.name ?? b.services[0]?.name ?? "Service";
}

function primaryBookingType(b: HomeItem): string {
	return b.services[0]?.bookingType ?? "regular";
}

function formatHeaderDate() {
	const now = new Date();
	return now.toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
	});
}

export default function TodayScreen() {
	const router = useRouter();
	const colors = useColors();
	const confirm = useConfirmBooking();
	const cancel = useCancelBooking();
	const unread = useUnreadCount();
	const { allowAutoConfirm, autoConfirmToday, mutateAutoConfirm, mutateAutoConfirmToday } = useAutoConfirm();
	const { data: profile } = useProfile();

	const { data: home, isLoading, refetch } = useBarberHome();

	const [refreshing, setRefreshing] = useState(false);
	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

	const pending = home?.pendingApproval.items ?? [];
	const confirmed = home?.schedule.items ?? [];
	const totalAppointments = home?.today.totalAppointments ?? 0;
	const earningsToday = home?.today.earningsSoFarUsd ?? 0;

	const unreadCount = unread.data ?? 0;

	if (isLoading) {
		return (
			<SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
				<View className="px-5 pt-4 gap-3">
					{[1, 2, 3, 4].map((i) => <SkeletonBookingCard key={i} />)}
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
			<ScrollView className="flex-1 px-5" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tertiary} />}>
				<Header
					title="Today"
					subtitle={formatHeaderDate()}
					right={
						<Pressable onPress={() => router.push("/(app)/(tabs)/today/notifications")} className="p-[6px]" accessibilityLabel="Notifications" accessibilityRole="button">
							<Icon name="bell" size={24} color={colors.ink} />
							{unreadCount > 0 && <View className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red border-2 border-surface" />}
						</Pressable>
					}
				/>

				{/* Setup alerts */}
				<SetupAlerts
					stripeConnected={profile?.stripeConnected}
					locationSet={profile?.locationSet}
					className="mb-xl"
				/>

				<EmailVerificationBanner className="mb-xl" />

				{/* Stats */}
				<View className="flex-row gap-[10px] mb-xl">
					<StatCard value={totalAppointments} label="Appointments" dark />
					<StatCard value={formatUsd(earningsToday)} label="Today's Earnings" />
				</View>

				{/* Pending */}
				{pending.length > 0 && (
					<Section title="Pending">
						{pending.map((b) => (
							<PendingCard
								key={b.bookingId}
								booking={b}
								onAccept={() =>
									confirm.mutate(b.bookingId, {
										onSuccess: () => toast.success("Booking confirmed"),
									})
								}
								onDecline={() =>
									cancel.mutate(b.bookingId, {
										onSuccess: () => toast.success("Booking declined"),
									})
								}
							/>
						))}
					</Section>
				)}

				{/* Schedule */}
				<Section title="Schedule" action="See All" onAction={() => router.push("/(app)/(tabs)/calendar")}>
					<Card elevated className="p-0 overflow-hidden">
						{confirmed.length === 0 && (
							<View className="py-8 items-center">
								<Text className="text-md text-tertiary">No confirmed bookings today</Text>
							</View>
						)}
						{confirmed.map((b, i) => (
							<ScheduleRow key={b.bookingId} booking={b} last={i === confirmed.length - 1} onPress={() => router.push(`/(app)/(tabs)/today/${b.bookingId}`)} />
						))}
					</Card>
				</Section>
				{/* Auto-Accept toggles */}
				<Card elevated className="p-0 overflow-hidden mb-xl">
					<View className="px-4">
						<Toggle on={allowAutoConfirm} onToggle={() => mutateAutoConfirm(!allowAutoConfirm)} label="Auto-accept all bookings" sub="New bookings are confirmed automatically" />
					</View>
					<Divider />
					<View className="px-4">
						<Toggle on={autoConfirmToday} onToggle={() => mutateAutoConfirmToday(!autoConfirmToday)} label="Auto-accept same-day" sub="Only same-day bookings are confirmed automatically" />
					</View>
				</Card>
			</ScrollView>
		</SafeAreaView>
	);
}

function PendingCard({ booking: b, onAccept, onDecline }: { booking: BarberHomePendingItem; onAccept: () => void; onDecline: () => void }) {
	const colors = useColors();
	const { time, ampm } = formatTime(b);
	const bookingType = primaryBookingType(b);

	return (
		<Card elevated>
			<View className="flex-row items-center gap-3 mb-[14px]">
				<Avatar name={b.client.fullName} size={40} />
				<View className="flex-1">
					<Text className="text-lg font-semibold text-ink tracking-[-0.2px]">{b.client.fullName}</Text>
					<View className="flex-row items-center gap-[6px] mt-[3px]">
						<Text className="text-base text-secondary">
							{joinedServiceName(b)} · {time} {ampm}
						</Text>
						<TypeBadge type={bookingType} />
					</View>
				</View>
				<Text className="text-xl font-bold text-ink tracking-[-0.3px]">${b.priceUsd}</Text>
			</View>

			<View className="flex-row gap-2">
				<Pressable onPress={onAccept} className="flex-1 flex-row items-center justify-center gap-[6px] py-[11px] rounded-sm bg-ink">
					<Icon name="check" size={16} color="#FFF" />
					<Text className="text-md font-semibold text-white">Accept</Text>
				</Pressable>
				<Pressable onPress={onDecline} className="flex-1 flex-row items-center justify-center gap-[6px] py-[11px] rounded-sm border-[1.5px] border-red/30 bg-red/[0.06]">
					<Icon name="close" size={14} color={colors.red} />
					<Text className="text-md font-semibold text-red">Decline</Text>
				</Pressable>
			</View>
		</Card>
	);
}

function ScheduleRow({ booking: b, last, onPress }: { booking: BarberHomeScheduleItem; last: boolean; onPress: () => void }) {
	const { time, ampm } = formatTime(b);
	const bookingType = primaryBookingType(b);
	const barColor = TYPE_BAR_COLORS[bookingType] ?? "#30D158";

	return (
		<Pressable onPress={onPress} className={`flex-row items-center gap-[14px] px-4 py-[14px] ${!last ? "border-b border-separator" : ""}`}>
			<View className="items-center min-w-[44px]">
				<Text className="text-xl font-bold text-ink tracking-[-0.3px]">{time}</Text>
				<Text className="text-xs font-semibold text-tertiary">{ampm}</Text>
			</View>

			<View style={{ backgroundColor: barColor }} className="w-[3px] h-9 rounded-full" />

			<View className="flex-1">
				<Text className="text-lg font-semibold text-ink tracking-[-0.2px]">{b.client.fullName}</Text>
				<View className="flex-row items-center gap-[5px] mt-[2px]">
					<Text className="text-base text-secondary">{joinedServiceName(b)}</Text>
					<TypeBadge type={bookingType} />
				</View>
			</View>

			<Text className="text-xl font-bold text-ink tracking-[-0.3px]">${b.priceUsd}</Text>
		</Pressable>
	);
}
