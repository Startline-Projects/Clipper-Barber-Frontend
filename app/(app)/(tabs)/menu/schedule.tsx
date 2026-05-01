import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Toggle from '@/components/ui/Toggle';
import Divider from '@/components/ui/Divider';
import Icon from '@/components/ui/Icon';
import TimeSelect, { generateTimeSlots, formatTime12 } from '@/components/forms/TimeSelect';
import { useColors } from '@/lib/theme/colors';
import { useSchedule, useUpdateScheduleDay } from '@/lib/hooks/useSchedule';
import type { ScheduleDay, DayOfWeek, UpdateScheduleDayBody } from '@/lib/api/schedule';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = generateTimeSlots(6, 23, 30);
const DURATION_OPTIONS = [15, 30, 45, 60] as const;
const NOTICE_OPTIONS = [0, 30, 60, 120, 240, 480, 1440];

function noticeLabel(mins: number): string {
  if (mins === 0) return 'None';
  if (mins < 60) return `${mins} min`;
  if (mins < 1440) return `${mins / 60} hr`;
  return `${mins / 1440} day`;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data, isLoading, isError, error, refetch } = useSchedule();
  const updateDay = useUpdateScheduleDay();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    new Date().getDay() as DayOfWeek,
  );
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
          <Text className="text-[15px] text-tertiary text-center mb-2">
            Could not load schedule
          </Text>
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

  const day = data.days.find((d) => d.dayOfWeek === selectedDay);

  const patch = (body: UpdateScheduleDayBody) => {
    updateDay.mutate(
      { dayOfWeek: selectedDay, body },
      {
        onError: (err: unknown) => {
          const msg =
            (err as { message?: string })?.message ??
            'Something went wrong. Please try again.';
          Alert.alert('Schedule update failed', msg);
        },
      },
    );
  };


  const handleTimeSelect = (time: string) => {
    if (!timePicker || !day) return;
    const field = timePicker.field;

    if (field === 'regularStartTime' && day.regularEndTime && time >= day.regularEndTime) {
      Alert.alert('Invalid time', 'Start time must be before end time.');
      return;
    }
    if (field === 'regularEndTime' && day.regularStartTime && time <= day.regularStartTime) {
      Alert.alert('Invalid time', 'End time must be after start time.');
      return;
    }
    if (field === 'afterHoursStart' && day.regularEndTime && time < day.regularEndTime) {
      Alert.alert('Invalid time', 'After-hours start must be at or after regular end time.');
      return;
    }
    if (field === 'afterHoursEnd' && day.afterHoursStart && time <= day.afterHoursStart) {
      Alert.alert('Invalid time', 'After-hours end must be after start time.');
      return;
    }
    if (field === 'dayOffStartTime' && day.dayOffEndTime && time >= day.dayOffEndTime) {
      Alert.alert('Invalid time', 'Start time must be before end time.');
      return;
    }
    if (field === 'dayOffEndTime' && day.dayOffStartTime && time <= day.dayOffStartTime) {
      Alert.alert('Invalid time', 'End time must be after start time.');
      return;
    }

    setTimePicker(null);
    patch({ [field]: time } as UpdateScheduleDayBody);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
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
                className={`flex-1 py-[10px] rounded-sm items-center ${
                  active ? 'bg-ink' : 'border-[1.5px] border-separator-opaque bg-card'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold tracking-[0.3px] ${
                    active ? 'text-bg' : 'text-ink'
                  }`}
                >
                  {label}
                </Text>
                <View
                  className={`w-[5px] h-[5px] rounded-full mt-1 ${
                    working
                      ? active
                        ? 'bg-green'
                        : 'bg-green'
                      : 'bg-separator-opaque'
                  }`}
                />
              </Pressable>
            );
          })}
        </View>

        {!day ? (
          <Card>
            <Text className="text-[14px] text-tertiary text-center py-4">
              No schedule data for {DAY_LABELS[selectedDay]}
            </Text>
          </Card>
        ) : (
          <>
            {/* Regular Day toggle */}
            <Card elevated>
              <Toggle
                label="Regular Day"
                sub={day.isWorking ? 'Accepting bookings' : 'Not accepting regular bookings'}
                on={day.isWorking}
                onToggle={() => {
                  if (!day.isWorking) {
                    patch({
                      isWorking: true,
                      dayOffBookingEnabled: false,
                      regularStartTime: day.regularStartTime ?? '09:00',
                      regularEndTime: day.regularEndTime ?? '17:00',
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
                sub={day.dayOffBookingEnabled ? 'Accepting day-off bookings at premium rates' : 'No day-off bookings'}
                on={day.dayOffBookingEnabled}
                onToggle={() => {
                  if (!day.dayOffBookingEnabled) {
                    patch({
                      dayOffBookingEnabled: true,
                      isWorking: false,
                      dayOffStartTime: day.dayOffStartTime ?? '10:00',
                      dayOffEndTime: day.dayOffEndTime ?? '16:00',
                    });
                  } else {
                    patch({ dayOffBookingEnabled: false });
                  }
                }}
              />
              {day.dayOffBookingEnabled && (
                <>
                  <Divider />
                  <View className="flex-row gap-3 mt-3">
                    <View className="flex-1">
                      <TimeSelect
                        label="Start"
                        value={day.dayOffStartTime ?? undefined}
                        color={colors.purple}
                        onPress={() =>
                          setTimePicker({
                            field: 'dayOffStartTime',
                            current: day.dayOffStartTime ?? undefined,
                          })
                        }
                      />
                    </View>
                    <View className="flex-1">
                      <TimeSelect
                        label="End"
                        value={day.dayOffEndTime ?? undefined}
                        color={colors.purple}
                        onPress={() =>
                          setTimePicker({
                            field: 'dayOffEndTime',
                            current: day.dayOffEndTime ?? undefined,
                          })
                        }
                      />
                    </View>
                  </View>
                </>
              )}
            </Card>

            {day.isWorking && (
              <>
                {/* Regular hours */}
                <Card elevated>
                  <Text className="text-[13px] font-bold text-secondary tracking-[0.3px] uppercase mb-3">
                    Regular Hours
                  </Text>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <TimeSelect
                        label="Start"
                        value={day.regularStartTime ?? undefined}
                        onPress={() =>
                          setTimePicker({
                            field: 'regularStartTime',
                            current: day.regularStartTime ?? undefined,
                          })
                        }
                      />
                    </View>
                    <View className="flex-1">
                      <TimeSelect
                        label="End"
                        value={day.regularEndTime ?? undefined}
                        onPress={() =>
                          setTimePicker({
                            field: 'regularEndTime',
                            current: day.regularEndTime ?? undefined,
                          })
                        }
                      />
                    </View>
                  </View>

                  <View className="mt-4">
                    <Text className="text-[12px] font-semibold text-tertiary tracking-[0.2px] uppercase mb-[6px]">
                      Slot Duration
                    </Text>
                    <View className="flex-row gap-2">
                      {DURATION_OPTIONS.map((dur) => (
                        <Pressable
                          key={dur}
                          onPress={() => patch({ slotDurationMinutes: dur })}
                          className={`flex-1 py-[10px] rounded-sm items-center border-[1.5px] ${
                            day.slotDurationMinutes === dur
                              ? 'border-ink bg-ink'
                              : 'border-separator-opaque bg-surface'
                          }`}
                        >
                          <Text
                            className={`text-[13px] font-semibold ${
                              day.slotDurationMinutes === dur
                                ? 'text-bg'
                                : 'text-ink'
                            }`}
                          >
                            {dur}m
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </Card>

                {/* After hours */}
                <Card elevated>
                  <Toggle
                    label="After-Hours Bookings"
                    sub="Accept bookings outside regular hours at premium rates"
                    on={day.afterHoursEnabled}
                    onToggle={() => {
                      if (!day.afterHoursEnabled) {
                        patch({
                          afterHoursEnabled: true,
                          afterHoursStart: day.afterHoursStart ?? '18:00',
                          afterHoursEnd: day.afterHoursEnd ?? '22:00',
                        });
                      } else {
                        patch({ afterHoursEnabled: false });
                      }
                    }}
                  />
                  {day.afterHoursEnabled && (
                    <>
                      <Divider />
                      <View className="flex-row gap-3 mt-3">
                        <View className="flex-1">
                          <TimeSelect
                            label="Start"
                            value={day.afterHoursStart ?? undefined}
                            color={colors.orange}
                            onPress={() =>
                              setTimePicker({
                                field: 'afterHoursStart',
                                current: day.afterHoursStart ?? undefined,
                              })
                            }
                          />
                        </View>
                        <View className="flex-1">
                          <TimeSelect
                            label="End"
                            value={day.afterHoursEnd ?? undefined}
                            color={colors.orange}
                            onPress={() =>
                              setTimePicker({
                                field: 'afterHoursEnd',
                                current: day.afterHoursEnd ?? undefined,
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
                    on={day.recurringEnabled}
                    onToggle={() => {
                      if (!day.recurringEnabled) {
                        patch({
                          recurringEnabled: true,
                          recurringFrequency: day.recurringFrequency ?? 'weekly',
                        });
                      } else {
                        patch({ recurringEnabled: false });
                      }
                    }}
                  />
                  {day.recurringEnabled && (
                    <>
                      <Divider />
                      <View className="mt-3">
                        <Text className="text-[12px] font-semibold text-tertiary tracking-[0.2px] uppercase mb-[6px]">
                          Frequency
                        </Text>
                        <View className="flex-row gap-2">
                          {(['weekly', 'biweekly', 'both'] as const).map(
                            (freq) => (
                              <Pressable
                                key={freq}
                                onPress={() =>
                                  patch({ recurringFrequency: freq })
                                }
                                className={`flex-1 py-[10px] rounded-sm items-center border-[1.5px] ${
                                  day.recurringFrequency === freq
                                    ? 'border-ink bg-ink'
                                    : 'border-separator-opaque bg-surface'
                                }`}
                              >
                                <Text
                                  className={`text-[13px] font-semibold capitalize ${
                                    day.recurringFrequency === freq
                                      ? 'text-bg'
                                      : 'text-ink'
                                  }`}
                                >
                                  {freq}
                                </Text>
                              </Pressable>
                            ),
                          )}
                        </View>
                      </View>
                    </>
                  )}
                </Card>

                {/* Advance notice */}
                <Card elevated>
                  <Text className="text-[13px] font-bold text-secondary tracking-[0.3px] uppercase mb-3">
                    Advance Notice
                  </Text>
                  <Text className="text-[12px] text-tertiary mb-3">
                    Minimum time before a client can book
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {NOTICE_OPTIONS.map((mins) => (
                      <Pressable
                        key={mins}
                        onPress={() => patch({ advanceNoticeMinutes: mins })}
                        className={`px-4 py-[10px] rounded-sm border-[1.5px] ${
                          day.advanceNoticeMinutes === mins
                            ? 'border-ink bg-ink'
                            : 'border-separator-opaque bg-surface'
                        }`}
                      >
                        <Text
                          className={`text-[13px] font-semibold ${
                            day.advanceNoticeMinutes === mins
                              ? 'text-bg'
                              : 'text-ink'
                          }`}
                        >
                          {noticeLabel(mins)}
                        </Text>
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

      {/* Time picker modal */}
      <Modal
        visible={timePicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setTimePicker(null)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setTimePicker(null)}
        >
          <Pressable
            className="bg-surface rounded-t-3xl px-5 pt-4 pb-8"
            onPress={() => {}}
          >
            <View className="w-10 h-1 rounded-full bg-separator-opaque self-center mb-[18px]" />
            <Text className="text-[22px] font-extrabold text-ink tracking-[-0.5px] mb-4">
              Select time
            </Text>
            <ScrollView className="max-h-[340px]">
              {TIME_SLOTS.map((slot) => (
                <Pressable
                  key={slot}
                  onPress={() => handleTimeSelect(slot)}
                  className={`py-[14px] px-4 rounded-md mb-1 ${
                    timePicker?.current === slot
                      ? 'bg-ink'
                      : 'active:bg-bg'
                  }`}
                >
                  <Text
                    className={`text-[16px] font-semibold ${
                      timePicker?.current === slot
                        ? 'text-bg'
                        : 'text-ink'
                    }`}
                  >
                    {formatTime12(slot)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
