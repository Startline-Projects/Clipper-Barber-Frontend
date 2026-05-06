import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Icon from '@/components/ui/Icon';
import TimeSelect from '@/components/forms/TimeSelect';
import { useColors } from '@/lib/theme/colors';
import { useServices } from '@/lib/hooks/useServices';
import { useClientDetail } from '@/lib/hooks/useClients';
import { useBarberRecurringSlots } from '@/lib/hooks/useRecurring';
import { toast } from '@/lib/stores/toast';
import { invalidations } from '@/lib/hooks/invalidations';
import { createArrangement } from '@/lib/api/recurringArrangements';
import type { ApiError } from '@/lib/api/client';
import type { Service } from '@/lib/api/services';

function todayLocalISODate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
] as const;

type Frequency = 'weekly' | 'biweekly';

export default function CreateRecurringScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const colors = useColors();
  const { data: client } = useClientDetail(clientId ?? '');
  const { data: services, isLoading: servicesLoading } = useServices();

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);

  const slotsQuery = useBarberRecurringSlots(
    selectedService ? [selectedService.id] : [],
    dayOfWeek,
  );
  const slotsData = slotsQuery.data;
  const slots = slotsData?.slots ?? [];
  const allowedFrequencies = slotsData?.recurringFrequencyOptions ?? ['weekly', 'biweekly'];
  const recurringAvailable = slotsData?.recurringAvailable ?? true;

  useEffect(() => {
    setTime(null);
  }, [selectedService?.id, dayOfWeek]);

  useEffect(() => {
    if (!slotsData) return;
    if (!allowedFrequencies.includes(frequency) && allowedFrequencies.length > 0) {
      setFrequency(allowedFrequencies[0]);
    }
  }, [slotsData, allowedFrequencies, frequency]);

  const qc = useQueryClient();
  const createMutation = useMutation({
    mutationFn: createArrangement,
    onSuccess: () => {
      invalidations.recurringMutated(qc, '');
      toast.success('Recurring offer sent to client');
      router.back();
    },
    onError: (err: ApiError) => {
      if (err.status === 409 && err.code === 'arrangement_has_conflicts') {
        toast.error('That slot conflicts with existing bookings');
        return;
      }
      toast.error(err.message ?? 'Failed to create recurring arrangement');
    },
  });

  const activeServices = services?.filter((s) => s.isActive) ?? [];
  const canSubmit = selectedService && dayOfWeek !== null && time;

  const handleCreate = () => {
    if (!canSubmit || !clientId) return;
    createMutation.mutate({
      clientId,
      services: [
        { barberServiceId: selectedService.id, bookingType: 'regular' },
      ],
      dayOfWeek: dayOfWeek!,
      timeOfDay: time,
      frequency,
      startDate: todayLocalISODate(),
      endType: 'none',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
          <Header title="New Recurring" onBack={() => router.back()} />

          {client && (
            <Text className="text-md text-tertiary mb-lg">
              Set up a recurring appointment for{' '}
              <Text className="font-semibold text-ink">{client.client.name}</Text>
            </Text>
          )}

          {/* Service */}
          <Card elevated>
            <Text className="text-base font-bold text-secondary tracking-[0.3px] uppercase mb-3">
              Service
            </Text>
            {servicesLoading ? (
              <ActivityIndicator color={colors.tertiary} />
            ) : (
              <Pressable
                onPress={() => setShowServicePicker(true)}
                className="flex-row items-center justify-between px-[10px] py-3 rounded-sm border-[1.5px] border-separator-opaque bg-surface"
              >
                <Text className={`text-md font-semibold ${selectedService ? 'text-ink' : 'text-tertiary'}`}>
                  {selectedService?.name ?? 'Select a service'}
                </Text>
                <Icon name="chevron" size={16} color={colors.tertiary} />
              </Pressable>
            )}
            {selectedService && (
              <Text className="text-sm text-tertiary mt-2">
                {selectedService.durationMinutes}min ·{' '}
                ${(selectedService.recurringPriceUsd ?? selectedService.regularPriceUsd).toFixed(0)}
                {selectedService.recurringPriceUsd != null && ' (recurring rate)'}
              </Text>
            )}
          </Card>

          {/* Day */}
          <Card elevated>
            <Text className="text-base font-bold text-secondary tracking-[0.3px] uppercase mb-3">
              Day of Week
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DAY_SHORT.map((label, i) => (
                <Pressable
                  key={i}
                  onPress={() => setDayOfWeek(i)}
                  className={`px-4 py-[10px] rounded-sm border-[1.5px] ${
                    dayOfWeek === i
                      ? 'border-green bg-green'
                      : 'border-separator-opaque bg-surface'
                  }`}
                >
                  <Text
                    className={`text-base font-semibold ${
                      dayOfWeek === i ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Time */}
          <Card elevated>
            <TimeSelect
              label="Time Slot"
              value={time ?? undefined}
              onPress={() => {
                if (!selectedService) {
                  toast.error('Select a service first');
                  return;
                }
                if (dayOfWeek === null) {
                  toast.error('Select a day first');
                  return;
                }
                setShowTimePicker(true);
              }}
              placeholder={
                !selectedService || dayOfWeek === null
                  ? 'Select service & day first'
                  : 'Select time'
              }
            />
            {selectedService && dayOfWeek !== null && (
              <>
                {slotsQuery.isLoading && (
                  <View className="flex-row items-center mt-2">
                    <ActivityIndicator size="small" color={colors.tertiary} />
                    <Text className="text-sm text-tertiary ml-2">
                      Loading availability…
                    </Text>
                  </View>
                )}
                {slotsData && !recurringAvailable && (
                  <Text className="text-sm text-red mt-2">
                    Recurring not available on {DAY_LABELS[dayOfWeek]} for this service.
                  </Text>
                )}
                {slotsData && recurringAvailable && slots.length === 0 && (
                  <Text className="text-sm text-tertiary mt-2">
                    No working hours configured for {DAY_LABELS[dayOfWeek]}.
                  </Text>
                )}
              </>
            )}
          </Card>

          {/* Frequency */}
          <Card elevated>
            <Text className="text-base font-bold text-secondary tracking-[0.3px] uppercase mb-3">
              Frequency
            </Text>
            <View className="flex-row gap-2">
              {FREQUENCIES.map((f) => {
                const disabled = !allowedFrequencies.includes(f.value);
                return (
                  <Pressable
                    key={f.value}
                    disabled={disabled}
                    onPress={() => setFrequency(f.value)}
                    className={`flex-1 py-[10px] rounded-sm items-center border-[1.5px] ${
                      frequency === f.value
                        ? 'border-green bg-green'
                        : disabled
                        ? 'border-separator-opaque bg-bg opacity-40'
                        : 'border-separator-opaque bg-surface'
                    }`}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        frequency === f.value ? 'text-white' : 'text-ink'
                      }`}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Summary */}
          {canSubmit && (
            <Card elevated className="bg-blue/6 border border-blue/20">
              <Text className="text-base font-bold text-blue tracking-[0.3px] uppercase mb-2">
                Summary
              </Text>
              <Text className="text-md text-ink leading-[20px]">
                {selectedService.name} every{' '}
                {frequency === 'biweekly' ? 'other ' : ''}
                {DAY_LABELS[dayOfWeek!]} at {time}
              </Text>
              <Text className="text-md font-bold text-ink mt-1">
                ${(selectedService.recurringPriceUsd ?? selectedService.regularPriceUsd).toFixed(0)}{' '}
                per session
              </Text>
            </Card>
          )}

          <Btn
            label={createMutation.isPending ? 'Creating...' : 'Create Recurring'}
            full
            onPress={handleCreate}
            disabled={!canSubmit || createMutation.isPending}
          />
          <View className="mt-2 mb-8">
            <Btn label="Cancel" variant="ghost" full onPress={() => router.back()} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Time picker */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowTimePicker(false)}
        >
          <Pressable className="bg-surface rounded-t-3xl px-5 pt-4 pb-8" onPress={() => {}}>
            <View className="w-10 h-1 rounded-full bg-separator-opaque self-center mb-[18px]" />
            <Text className="text-3xl font-extrabold text-ink tracking-[-0.5px] mb-1">
              Select time
            </Text>
            {dayOfWeek !== null && (
              <Text className="text-sm text-tertiary mb-4">
                {DAY_LABELS[dayOfWeek]} · taken slots are disabled
              </Text>
            )}
            <ScrollView className="max-h-[340px]">
              {slots.length === 0 && (
                <Text className="text-md text-tertiary text-center py-6">
                  No slots for this day.
                </Text>
              )}
              {slots.map((slot) => {
                const selected = time === slot.time;
                return (
                  <Pressable
                    key={slot.time}
                    disabled={!slot.available}
                    onPress={() => {
                      setTime(slot.time);
                      setShowTimePicker(false);
                    }}
                    className={`flex-row items-center justify-between py-[14px] px-4 rounded-md mb-1 ${
                      selected
                        ? 'bg-green'
                        : slot.available
                        ? 'active:bg-bg'
                        : 'bg-bg opacity-50'
                    }`}
                  >
                    <Text
                      className={`text-[16px] font-semibold ${
                        selected
                          ? 'text-white'
                          : slot.available
                          ? 'text-ink'
                          : 'text-tertiary line-through'
                      }`}
                    >
                      {slot.time}
                    </Text>
                    {!slot.available && (
                      <Text className="text-xs font-bold text-tertiary tracking-[0.3px] uppercase">
                        Taken
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Service picker */}
      <Modal
        visible={showServicePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowServicePicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowServicePicker(false)}
        >
          <Pressable className="bg-surface rounded-t-3xl px-5 pt-4 pb-8" onPress={() => {}}>
            <View className="w-10 h-1 rounded-full bg-separator-opaque self-center mb-[18px]" />
            <Text className="text-3xl font-extrabold text-ink tracking-[-0.5px] mb-4">
              Select service
            </Text>
            <ScrollView className="max-h-[340px]">
              {activeServices.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => {
                    setSelectedService(s);
                    setShowServicePicker(false);
                  }}
                  className={`py-[14px] px-4 rounded-md mb-1 ${
                    selectedService?.id === s.id ? 'bg-green' : 'active:bg-bg'
                  }`}
                >
                  <Text
                    className={`text-lg font-semibold ${
                      selectedService?.id === s.id ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {s.name}
                  </Text>
                  <Text
                    className={`text-sm mt-[2px] ${
                      selectedService?.id === s.id ? 'text-white/60' : 'text-tertiary'
                    }`}
                  >
                    {s.durationMinutes}min · ${s.regularPriceUsd.toFixed(0)}
                    {s.recurringPriceUsd != null && ` · Recurring $${s.recurringPriceUsd.toFixed(0)}`}
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
