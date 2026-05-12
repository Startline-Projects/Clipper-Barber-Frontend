import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/Icon";
import Divider from "@/components/ui/Divider";
import TypeBadge from "@/components/ui/TypeBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import Btn from "@/components/ui/Btn";
import { useColors } from "@/lib/theme/colors";
import { useClientDetail } from "@/lib/hooks/useClients";
import { useStartConversation } from "@/lib/hooks/useConversations";
import { toast } from "@/lib/stores/toast";
import { getReadableError } from "@/lib/utils/get-readable-error";
import type { ClientBooking, ClientRecurring } from "@/lib/api/clients";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function usd(n: number): string {
	return `$${n.toFixed(0)}`;
}

import { formatBookingDate, formatBookingTime, type BookingTimeFields } from "@/lib/utils/timezone";

function formatDate(b: BookingTimeFields | string): string {
	if (typeof b === "string") return formatBookingDate({ scheduledAt: b });
	return formatBookingDate(b);
}

function formatTime(b: BookingTimeFields | string): string {
	if (typeof b === "string") return formatBookingTime({ scheduledAt: b });
	return formatBookingTime(b);
}

export default function ClientDetailScreen() {
	const { clientId } = useLocalSearchParams<{ clientId: string }>();
	const router = useRouter();
	const colors = useColors();
	const { data, isLoading, isPlaceholderData, isError, error, refetch } = useClientDetail(clientId ?? "");
	const startConvo = useStartConversation();

	const handleMessage = () => {
		if (!clientId || startConvo.isPending) return;
		startConvo.mutate(clientId, {
			onSuccess: (convo) => {
				router.push(`/(app)/(tabs)/messages/${convo.id}`);
			},
			onError: (err) => toast.error(getReadableError(err)),
		});
	};

	if (isError) {
		const msg = getReadableError(error);
		if (__DEV__) console.warn("[ClientDetail] load failed:", error);
		return (
			<SafeAreaView className="flex-1 bg-bg">
				<View className="px-5">
					<Header title="Client" onBack={() => router.back()} />
				</View>
				<View className="flex-1 items-center justify-center px-6">
					<Text className="text-md text-tertiary text-center mb-4">{msg}</Text>
					<Btn label="Retry" onPress={() => refetch()} />
				</View>
			</SafeAreaView>
		);
	}

	if (isLoading || !data) {
		return (
			<SafeAreaView className="flex-1 bg-bg">
				<View className="px-5">
					<Header title="Client" onBack={() => router.back()} />
				</View>
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator color={colors.tertiary} />
				</View>
			</SafeAreaView>
		);
	}

	const { client, stats } = data;

	return (
		<SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
			<ScrollView className="flex-1 px-5">
				<Header title="Client" onBack={() => router.back()} />

				{/* Client header */}
				<View className="items-center pb-4">
					<Avatar name={client.name} uri={client.profilePhotoUrl ?? undefined} size={72} />
					<Text className="text-2xl font-bold text-ink tracking-[-0.4px] mt-3">{client.name}</Text>
					{client.email && <Text className="text-base text-tertiary mt-1">{client.email}</Text>}
					{client.isGuest && (
						<View className="mt-2 px-2 py-[2px] rounded-xs bg-separator-opaque">
							<Text className="text-xs font-bold text-tertiary tracking-[0.3px]">GUEST</Text>
						</View>
					)}
				</View>

				{/* Actions */}
				<View className="flex-row gap-3 mb-lg">
					<View className="flex-1">
						<Btn label={startConvo.isPending ? "Opening..." : "Message"} variant="ghost" full disabled={startConvo.isPending} onPress={handleMessage} />
					</View>
					<View className="flex-1">
						<Btn label="New Recurring" full onPress={() => router.push(`/(app)/(tabs)/menu/clients/${clientId}/create-recurring`)} />
					</View>
				</View>

				{/* Stats */}
				<Card elevated>
					<StatRow label="Total Visits" value={stats.totalVisits.toString()} />
					<Divider />
					<StatRow label="Total Spend" value={usd(stats.totalSpendUsd)} />
					<Divider />
					<StatRow label="Avg Spend" value={usd(stats.averageSpendUsd)} />
					<Divider />
					<StatRow label="Favourite Service" value={stats.favouriteService?.name ?? "—"} />
					<Divider />
					<StatRow label="First Visit" value={stats.firstVisitAt ? formatDate(stats.firstVisitAt) : "—"} />
					<Divider />
					<StatRow label="Last Visit" value={stats.lastVisitAt ? formatDate(stats.lastVisitAt) : "—"} />
					{(stats.noShowCount > 0 || stats.cancellationCount > 0) && (
						<>
							<Divider />
							<StatRow label="No-Shows / Cancels" value={`${stats.noShowCount} / ${stats.cancellationCount}`} warn={stats.noShowCount > 0} />
						</>
					)}
				</Card>

				{/* Upcoming */}
				{data.upcomingBookings.length > 0 && (
					<Section title="Upcoming">
						<Card elevated className="p-0 overflow-hidden">
							{data.upcomingBookings.map((b, i) => (
								<View key={b.id}>
									{i > 0 && <Divider />}
									<BookingRow booking={b} />
								</View>
							))}
						</Card>
					</Section>
				)}

				{/* Recurring */}
				{data.recurringSeries.length > 0 && (
					<Section title="Recurring">
						<Card elevated className="p-0 overflow-hidden">
							{data.recurringSeries.map((r, i) => (
								<View key={r.id}>
									{i > 0 && <Divider />}
									<RecurringRow recurring={r} />
								</View>
							))}
						</Card>
					</Section>
				)}

				{/* Past bookings */}
				{data.pastBookings.items.length > 0 && (
					<Section title={`Past (${data.pastBookings.pagination.totalBookings})`}>
						<Card elevated className="p-0 overflow-hidden">
							{data.pastBookings.items.map((b, i) => (
								<View key={b.id}>
									{i > 0 && <Divider />}
									<BookingRow booking={b} />
								</View>
							))}
						</Card>
					</Section>
				)}

				<View className="h-8" />
			</ScrollView>
		</SafeAreaView>
	);
}

function StatRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
	return (
		<View className="flex-row items-center justify-between py-[11px]">
			<Text className="text-md text-secondary">{label}</Text>
			<Text className={`text-md font-semibold tracking-[-0.1px] ${warn ? "text-red" : "text-ink"}`}>{value}</Text>
		</View>
	);
}

function BookingRow({ booking: b }: { booking: ClientBooking }) {
	const serviceNames = b.services.map((s) => s.name).join(", ") || b.services.map((s) => s.type) || "Service";
	return (
		<View className="px-4 py-[12px]">
			<View className="flex-row items-center justify-between mb-[4px]">
				<Text className="text-md font-semibold text-ink tracking-[-0.2px]">{serviceNames}</Text>
				<Text className="text-md font-bold text-ink">{usd(b.totalPriceUsd)}</Text>
			</View>
			<View className="flex-row items-center gap-2">
				<Text className="text-sm text-tertiary">
					{formatDate(b)} · {formatTime(b)} · {b.totalDurationMinutes}min
				</Text>
				<TypeBadge type={b.bookingType} />
				<StatusBadge status={b.status} />
			</View>
		</View>
	);
}

function RecurringRow({ recurring: r }: { recurring: ClientRecurring }) {
	return (
		<View className="px-4 py-[12px]">
			<View className="flex-row items-center justify-between mb-[4px]">
				<Text className="text-md font-semibold text-ink tracking-[-0.2px]">{r.service.name}</Text>
				<Text className="text-md font-bold text-ink">{usd(r.priceUsd)}</Text>
			</View>
			<Text className="text-sm text-tertiary">
				{DAY_LABELS[r.dayOfWeek]}s · {r.slotTime} · {r.frequency}
				{r.nextOccurrenceAt ? ` · Next ${formatDate(r.nextOccurrenceAt)}` : ""}
			</Text>
			<View className="flex-row items-center gap-2 mt-1">
				<View className={`px-[6px] py-[1px] rounded-xs ${r.active ? "bg-green/12" : "bg-separator-opaque"}`}>
					<Text className={`text-2xs font-bold tracking-[0.3px] ${r.active ? "text-green" : "text-tertiary"}`}>{r.status.replace(/_/g, " ").toUpperCase()}</Text>
				</View>
			</View>
		</View>
	);
}
