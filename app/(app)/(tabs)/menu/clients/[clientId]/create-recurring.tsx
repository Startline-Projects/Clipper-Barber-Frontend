import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Icon from '@/components/ui/Icon';
import TimeSelect, { generateTimeSlots } from '@/components/forms/TimeSelect';
import { useColors } from '@/lib/theme/colors';
import { useServices } from '@/lib/hooks/useServices';
import { useClientDetail } from '@/lib/hooks/useClients';
import type { Service } from '@/lib/api/services';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = generateTimeSlots(6, 23, 30);
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

  const activeServices = services?.filter((s) => s.isActive) ?? [];
  const canSubmit = selectedService && dayOfWeek !== null && time;

  const handleCreate = () => {
    if (!canSubmit) return;
    Alert.alert(
      'Coming Soon',
      'Creating recurring arrangements from the barber side will be available in a future update.',
    );
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
            <Text className="text-[14px] text-tertiary mb-lg">
              Set up a recurring appointment for{' '}
              <Text className="font-semibold text-ink">{client.client.name}</Text>
            </Text>
          )}

          {/* Service */}
          <Card elevated>
            <Text className="text-[13px] font-bold text-secondary tracking-[0.3px] uppercase mb-3">
              Service
            </Text>
            {servicesLoading ? (
              <ActivityIndicator color={colors.tertiary} />
            ) : (
              <Pressable
                onPress={() => setShowServicePicker(true)}
                className="flex-row items-center justify-between px-[10px] py-3 rounded-sm border-[1.5px] border-separator-opaque bg-surface"
              >
                <Text className={`text-[14px] font-semibold ${selectedService ? 'text-ink' : 'text-tertiary'}`}>
                  {selectedService?.name ?? 'Select a service'}
                </Text>
                <Icon name="chevron" size={16} color={colors.tertiary} />
              </Pressable>
            )}
            {selectedService && (
              <Text className="text-[12px] text-tertiary mt-2">
                {selectedService.durationMinutes}min ·{' '}
                ${(selectedService.recurringPriceUsd ?? selectedService.regularPriceUsd).toFixed(0)}
                {selectedService.recurringPriceUsd != null && ' (recurring rate)'}
              </Text>
            )}
          </Card>

          {/* Day */}
          <Card elevated>
            <Text className="text-[13px] font-bold text-secondary tracking-[0.3px] uppercase mb-3">
              Day of Week
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DAY_SHORT.map((label, i) => (
                <Pressable
                  key={i}
                  onPress={() => setDayOfWeek(i)}
                  className={`px-4 py-[10px] rounded-sm border-[1.5px] ${
                    dayOfWeek === i
                      ? 'border-ink bg-ink'
                      : 'border-separator-opaque bg-surface'
                  }`}
                >
                  <Text
                    className={`text-[13px] font-semibold ${
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
              onPress={() => setShowTimePicker(true)}
              placeholder="Select time"
            />
          </Card>

          {/* Frequency */}
          <Card elevated>
            <Text className="text-[13px] font-bold text-secondary tracking-[0.3px] uppercase mb-3">
              Frequency
            </Text>
            <View className="flex-row gap-2">
              {FREQUENCIES.map((f) => (
                <Pressable
                  key={f.value}
                  onPress={() => setFrequency(f.value)}
                  className={`flex-1 py-[10px] rounded-sm items-center border-[1.5px] ${
                    frequency === f.value
                      ? 'border-ink bg-ink'
                      : 'border-separator-opaque bg-surface'
                  }`}
                >
                  <Text
                    className={`text-[13px] font-semibold ${
                      frequency === f.value ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Summary */}
          {canSubmit && (
            <Card elevated className="bg-blue/6 border border-blue/20">
              <Text className="text-[13px] font-bold text-blue tracking-[0.3px] uppercase mb-2">
                Summary
              </Text>
              <Text className="text-[14px] text-ink leading-[20px]">
                {selectedService.name} every{' '}
                {frequency === 'biweekly' ? 'other ' : ''}
                {DAY_LABELS[dayOfWeek!]} at {time}
              </Text>
              <Text className="text-[14px] font-bold text-ink mt-1">
                ${(selectedService.recurringPriceUsd ?? selectedService.regularPriceUsd).toFixed(0)}{' '}
                per session
              </Text>
            </Card>
          )}

          <Btn
            label="Create Recurring"
            full
            onPress={handleCreate}
            disabled={!canSubmit}
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
            <Text className="text-[22px] font-extrabold text-ink tracking-[-0.5px] mb-4">
              Select time
            </Text>
            <ScrollView className="max-h-[340px]">
              {TIME_SLOTS.map((slot) => (
                <Pressable
                  key={slot}
                  onPress={() => {
                    setTime(slot);
                    setShowTimePicker(false);
                  }}
                  className={`py-[14px] px-4 rounded-md mb-1 ${
                    time === slot ? 'bg-ink' : 'active:bg-bg'
                  }`}
                >
                  <Text
                    className={`text-[16px] font-semibold ${
                      time === slot ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {slot}
                  </Text>
                </Pressable>
              ))}
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
            <Text className="text-[22px] font-extrabold text-ink tracking-[-0.5px] mb-4">
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
                    selectedService?.id === s.id ? 'bg-ink' : 'active:bg-bg'
                  }`}
                >
                  <Text
                    className={`text-[15px] font-semibold ${
                      selectedService?.id === s.id ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {s.name}
                  </Text>
                  <Text
                    className={`text-[12px] mt-[2px] ${
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
