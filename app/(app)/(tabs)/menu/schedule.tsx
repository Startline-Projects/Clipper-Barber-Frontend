import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Toggle from "@/components/ui/Toggle";
import Divider from "@/components/ui/Divider";
import Icon from "@/components/ui/Icon";
import TimeSelect, { generateTimeSlots, formatTime12 } from "@/components/forms/TimeSelect";
import { useColors } from "@/lib/theme/colors";
import { useSchedule, useUpdateScheduleDay } from "@/lib/hooks/useSchedule";
import { toast } from "@/lib/stores/toast";
import { getReadableError } from "@/lib/utils/get-readable-error";
import type { ScheduleDay, DayOfWeek, UpdateScheduleDayBody } from "@/lib/api/schedule";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_SLOTS = generateTimeSlots(6, 23, 30);
const DURATION_OPTIONS = [15, 30, 45, 60] as const;
const NOTICE_OPTIONS = [0, 30, 60, 120, 240, 480, 1440];

function noticeLabel(mins: number): string {
	if (mins === 0) return "None";
	if (mins < 60) return `${mins} min`;
	if (mins < 1440) return `${mins / 60} hr`;
	return `${mins / 1440} day`;
}

export default function ScheduleScreen() {
	const router = useRouter();
	const colors = useColors();
	const { data, isLoading, isError, error, refetch } = useSchedule();
	const updateDay = useUpdateScheduleDay();

	const [selectedDay, setSelectedDay] = useState<DayOfWeek>(new Date().getDay() as DayOfWeek);
	const [drafts, setDrafts] = useState<Record<number, UpdateScheduleDayBody>>({});
	const [saving, setSaving] = useState(false);
	const [timePicker, setTimePicker] = useState<{
		field: string;
		current?: string;
	} | null>(null);

	if (isLoading) {
		return (
			<SafeAreaView className="flex-1 bg-bg">
				<View className="px-5">
					<Header title="Schedule" onBack={() => router.back()} />
				</View>
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator color={colors.tertiary} />
				</View>
			</SafeAreaView>
		);
	}

	if (isError || !data) {
		return (
			<SafeAreaView className="flex-1 bg-bg">
				<View className="px-5">
					<Header title="Schedule" onBack={() => router.back()} />
				</View>
				<View className="flex-1 items-center justify-center px-8">
					<Text className="text-[15px] text-tertiary text-center mb-4">{getReadableError(error)}</Text>
					<Pressable onPress={() => refetch()}>
						<Text className="text-[14px] font-semibold text-blue">Retry</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		);
	}

	const day = data.days.find((d) => d.dayOfWeek === selectedDay);
	const dDay: ScheduleDay | undefined = day ? { ...day, ...(drafts[selectedDay] ?? {}) } : undefined;
	const dirtyCount = Object.keys(drafts).length;
	const isDirty = dirtyCount > 0;

	const patch = (body: UpdateScheduleDayBody) => {
		setDrafts((prev) => ({
			...prev,
			[selectedDay]: { ...(prev[selectedDay] ?? {}), ...body },
		}));
	};

	const handleSave = async () => {
		if (saving || !isDirty) return;
		setSaving(true);
		const entries = Object.entries(drafts);
		const failed: Record<number, UpdateScheduleDayBody> = {};
		let firstError: unknown = null;
		for (const [d, body] of entries) {
			try {
				await updateDay.mutateAsync({ dayOfWeek: Number(d) as DayOfWeek, body });
			} catch (err) {
				failed[Number(d)] = body;
				if (!firstError) firstError = err;
			}
		}
		setDrafts(failed);
		setSaving(false);
		if (firstError) {
			toast.error(getReadableError(firstError));
		} else {
			toast.success("Schedule updated");
		}
	};

	const handleTimeSelect = (time: string) => {
		if (!timePicker || !dDay) return;
		const field = timePicker.field;

		if (field === "regularStartTime" && dDay.regularEndTime && time >= dDay.regularEndTime) {
			toast.error("Start time must be before end time.");
			return;
		}
		if (field === "regularEndTime" && dDay.regularStartTime && time <= dDay.regularStartTime) {
			toast.error("End time must be after start time.");
			return;
		}
		if (field === "afterHoursStart" && dDay.regularEndTime && time < dDay.regularEndTime) {
			toast.error("After-hours start must be at or after regular end time.");
			return;
		}
		if (field === "afterHoursEnd" && dDay.afterHoursStart && time <= dDay.afterHoursStart) {
			toast.error("After-hours end must be after start time.");
			return;
		}
		if (field === "dayOffStartTime" && dDay.dayOffEndTime && time >= dDay.dayOffEndTime) {
			toast.error("Start time must be before end time.");
			return;
		}
		if (field === "dayOffEndTime" && dDay.dayOffStartTime && time <= dDay.dayOffStartTime) {
			toast.error("End time must be after start time.");
			return;
		}

		setTimePicker(null);
		patch({ [field]: time } as UpdateScheduleDayBody);
	};

	return (
		<SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
			<ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 110 }}>
				<Header title="Schedule" onBack={() => router.back()} />

				{/* Day selector */}
				<View className="flex-row gap-[6px] mb-lg">
					{DAY_SHORT.map((label, i) => {
						const active = i === selectedDay;
						const dayData = data.days.find((d) => d.dayOfWeek === i);
						const working = dayData?.isWorking ?? false;
						return (
							<Pressable
								key={i}
								onPress={() => setSelectedDay(i as DayOfWeek)}
								className={`flex-1 py-[10px] rounded-sm items-center ${active ? "bg-green" : "border-[1.5px] border-separator-opaque bg-card"}`}>
								<Text className={`text-[11px] font-bold tracking-[0.3px] ${active ? "text-white" : "text-ink"}`}>{label}</Text>
								<View className={`w-[5px] h-[5px] rounded-full mt-1 ${working ? (active ? "bg-white" : "bg-green") : "bg-separator-opaque"}`} />
							</Pressable>
						);
					})}
				</View>

				{!dDay ? (
					<Card>
						<Text className="text-[14px] text-tertiary text-center py-4">No schedule data for {DAY_LABELS[selectedDay]}</Text>
					</Card>
				) : (
					<>
						{/* Regular Day toggle */}
						<Card elevated>
							<Toggle
								label="Regular Day"
								sub={dDay.isWorking ? "Accepting bookings" : "Not accepting regular bookings"}
								on={dDay.isWorking}
								onToggle={() => {
									if (!dDay.isWorking) {
										patch({
											isWorking: true,
											dayOffBookingEnabled: false,
											regularStartTime: dDay.regularStartTime ?? "09:00",
											regularEndTime: dDay.regularEndTime ?? "17:00",
										});
									} else {
										patch({
											isWorking: false,
											recurringEnabled: false,
											afterHoursEnabled: false,
										});
									}
								}}
							/>
						</Card>

						{/* Day-Off Bookings toggle */}
						<Card elevated>
							<Toggle
								label="Day-Off Bookings"
								sub={dDay.dayOffBookingEnabled ? "Accepting day-off bookings at premium rates" : "No day-off bookings"}
								on={dDay.dayOffBookingEnabled}
								onToggle={() => {
									if (!dDay.dayOffBookingEnabled) {
										patch({
											dayOffBookingEnabled: true,
											isWorking: false,
											dayOffStartTime: dDay.dayOffStartTime ?? "10:00",
											dayOffEndTime: dDay.dayOffEndTime ?? "16:00",
										});
									} else {
										patch({ dayOffBookingEnabled: false });
									}
								}}
							/>
							{dDay.dayOffBookingEnabled && (
								<>
									<Divider />
									<View className="flex-row gap-3 mt-3">
										<View className="flex-1">
											<TimeSelect
												label="Start"
												value={dDay.dayOffStartTime ?? undefined}
												color={colors.purple}
												onPress={() =>
													setTimePicker({
														field: "dayOffStartTime",
														current: dDay.dayOffStartTime ?? undefined,
													})
												}
											/>
										</View>
										<View className="flex-1">
											<TimeSelect
												label="End"
												value={dDay.dayOffEndTime ?? undefined}
												color={colors.purple}
												onPress={() =>
													setTimePicker({
														field: "dayOffEndTime",
														current: dDay.dayOffEndTime ?? undefined,
													})
												}
											/>
										</View>
									</View>
								</>
							)}
						</Card>

						{/* Slot Duration — mandatory for every day, including day-off */}
						<SlotDurationCard value={dDay.slotDurationMinutes} onChange={(mins) => patch({ slotDurationMinutes: mins })} />

						{dDay.isWorking && (
							<>
								{/* Regular hours */}
								<Card elevated>
									<Text className="text-[13px] font-bold text-secondary tracking-[0.3px] uppercase mb-3">Regular Hours</Text>
									<View className="flex-row gap-3">
										<View className="flex-1">
											<TimeSelect
												label="Start"
												value={dDay.regularStartTime ?? undefined}
												onPress={() =>
													setTimePicker({
														field: "regularStartTime",
														current: dDay.regularStartTime ?? undefined,
													})
												}
											/>
										</View>
										<View className="flex-1">
											<TimeSelect
												label="End"
												value={dDay.regularEndTime ?? undefined}
												onPress={() =>
													setTimePicker({
														field: "regularEndTime",
														current: dDay.regularEndTime ?? undefined,
													})
												}
											/>
										</View>
									</View>
								</Card>

								{/* After hours */}
								<Card elevated>
									<Toggle
										label="After-Hours Bookings"
										sub="Accept bookings outside regular hours at premium rates"
										on={dDay.afterHoursEnabled}
										onToggle={() => {
											if (!dDay.afterHoursEnabled) {
												patch({
													afterHoursEnabled: true,
													afterHoursStart: dDay.afterHoursStart ?? "18:00",
													afterHoursEnd: dDay.afterHoursEnd ?? "22:00",
												});
											} else {
												patch({ afterHoursEnabled: false });
											}
										}}
									/>
									{dDay.afterHoursEnabled && (
										<>
											<Divider />
											<View className="flex-row gap-3 mt-3">
												<View className="flex-1">
													<TimeSelect
														label="Start"
														value={dDay.afterHoursStart ?? undefined}
														color={colors.orange}
														onPress={() =>
															setTimePicker({
																field: "afterHoursStart",
																current: dDay.afterHoursStart ?? undefined,
															})
														}
													/>
												</View>
												<View className="flex-1">
													<TimeSelect
														label="End"
														value={dDay.afterHoursEnd ?? undefined}
														color={colors.orange}
														onPress={() =>
															setTimePicker({
																field: "afterHoursEnd",
																current: dDay.afterHoursEnd ?? undefined,
															})
														}
													/>
												</View>
											</View>
										</>
									)}
								</Card>

								{/* Recurring */}
								<Card elevated>
									<Toggle
										label="Recurring Bookings"
										sub="Allow clients to set up recurring appointments"
										on={dDay.recurringEnabled}
										onToggle={() => {
											if (!dDay.recurringEnabled) {
												patch({
													recurringEnabled: true,
													recurringFrequency: dDay.recurringFrequency ?? "weekly",
												});
											} else {
												patch({ recurringEnabled: false });
											}
										}}
									/>
									{dDay.recurringEnabled && (
										<>
											<Divider />
											<View className="mt-3">
												<Text className="text-[12px] font-semibold text-tertiary tracking-[0.2px] uppercase mb-[6px]">Frequency</Text>
												<View className="flex-row gap-2">
													{(["weekly", "biweekly", "both"] as const).map((freq) => (
														<Pressable
															key={freq}
															onPress={() => patch({ recurringFrequency: freq })}
															className={`flex-1 py-[10px] rounded-sm items-center border-[1.5px] ${dDay.recurringFrequency === freq ? "border-green bg-green" : "border-separator-opaque bg-surface"}`}>
															<Text className={`text-[13px] font-semibold capitalize ${dDay.recurringFrequency === freq ? "text-white" : "text-ink"}`}>{freq}</Text>
														</Pressable>
													))}
												</View>
											</View>

											<RecurringExtraFeeField value={dDay.recurringExtraChargeUsd ?? 0} onChange={(amt) => patch({ recurringExtraChargeUsd: amt })} />
										</>
									)}
								</Card>

								{/* Advance notice */}
								<Card elevated>
									<Text className="text-[13px] font-bold text-secondary tracking-[0.3px] uppercase mb-3">Advance Notice</Text>
									<Text className="text-[12px] text-tertiary mb-3">Minimum time before a client can book</Text>
									<View className="flex-row flex-wrap gap-2">
										{NOTICE_OPTIONS.map((mins) => (
											<Pressable
												key={mins}
												onPress={() => patch({ advanceNoticeMinutes: mins })}
												className={`px-4 py-[10px] rounded-sm border-[1.5px] ${dDay.advanceNoticeMinutes === mins ? "border-green bg-green" : "border-separator-opaque bg-surface"}`}>
												<Text className={`text-[13px] font-semibold ${dDay.advanceNoticeMinutes === mins ? "text-white" : "text-ink"}`}>{noticeLabel(mins)}</Text>
											</Pressable>
										))}
									</View>
								</Card>
							</>
						)}

						<View className="h-8" />
					</>
				)}
			</ScrollView>

			{/* Sticky Save bar */}
			<View className="absolute left-0 right-0 bottom-0 px-5 pt-3 pb-8 bg-surface border-t border-separator-opaque">
				<Pressable
					onPress={handleSave}
					disabled={!isDirty || saving}
					className={`rounded-md py-[14px] items-center justify-center ${isDirty && !saving ? "bg-green active:opacity-80" : "bg-green/40"}`}>
					{saving ? (
						<ActivityIndicator color={colors.ink} />
					) : (
						<Text className="text-[15px] font-bold text-ink tracking-[0.3px]">{isDirty ? `Save${dirtyCount > 1 ? ` (${dirtyCount} days)` : ""}` : "Saved"}</Text>
					)}
				</Pressable>
			</View>

			{/* Time picker modal */}
			<Modal visible={timePicker !== null} transparent animationType="slide" onRequestClose={() => setTimePicker(null)}>
				<Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setTimePicker(null)}>
					<Pressable className="bg-surface rounded-t-3xl px-5 pt-4 pb-8" onPress={() => {}}>
						<View className="w-10 h-1 rounded-full bg-separator-opaque self-center mb-[18px]" />
						<Text className="text-[22px] font-extrabold text-ink tracking-[-0.5px] mb-4">Select time</Text>
						<ScrollView className="max-h-[340px]">
							{TIME_SLOTS.map((slot) => (
								<Pressable key={slot} onPress={() => handleTimeSelect(slot)} className={`py-[14px] px-4 rounded-md mb-1 ${timePicker?.current === slot ? "bg-green" : "active:bg-bg"}`}>
									<Text className={`text-[16px] font-semibold ${timePicker?.current === slot ? "text-white" : "text-ink"}`}>{formatTime12(slot)}</Text>
								</Pressable>
							))}
						</ScrollView>
					</Pressable>
				</Pressable>
			</Modal>
		</SafeAreaView>
	);
}

function RecurringExtraFeeField({ value, onChange }: { value: number; onChange: (amount: number) => void }) {
	const [draft, setDraft] = useState<string>(value ? String(value) : "");

	const commit = () => {
		const trimmed = draft.trim();
		const n = trimmed === "" ? 0 : parseFloat(trimmed);
		if (Number.isFinite(n) && n >= 0 && n !== value) onChange(n);
	};

	return (
		<View className="mt-3">
			<Text className="text-[12px] font-semibold text-tertiary tracking-[0.2px] uppercase mb-[6px]">Extra fee for recurring bookings</Text>
			<View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-4">
				<Text className="text-[15px] font-semibold text-gray-900 dark:text-white mr-2">$</Text>
				<TextInput
					value={draft}
					onChangeText={setDraft}
					onBlur={commit}
					onSubmitEditing={commit}
					keyboardType="decimal-pad"
					placeholder="0"
					placeholderTextColor="#9ca3af"
					className="flex-1 text-gray-900 dark:text-white py-3 text-[15px]"
				/>
			</View>
			<Text className="text-xs text-gray-400 dark:text-gray-500 mt-[6px]">This amount will be added to the service price when a client books a recurring appointment.</Text>
		</View>
	);
}

function SlotDurationCard({ value, onChange }: { value: number; onChange: (mins: 15 | 30 | 45 | 60) => void }) {
	return (
		<Card elevated>
			<Text className="text-[13px] font-bold text-secondary tracking-[0.3px] uppercase mb-3">Slot Duration</Text>
			<View className="flex-row flex-wrap gap-2">
				{DURATION_OPTIONS.map((dur) => {
					const selected = value === dur;
					return (
						<Pressable key={dur} onPress={() => onChange(dur)} className={`px-4 py-[10px] rounded-sm items-center active:opacity-70 ${selected ? "bg-green" : "bg-gray-100 dark:bg-gray-800"}`}>
							<Text className={`text-[13px] font-semibold ${selected ? "text-white" : "text-gray-900 dark:text-white"}`}>{dur} min</Text>
						</Pressable>
					);
				})}
			</View>
		</Card>
	);
}
