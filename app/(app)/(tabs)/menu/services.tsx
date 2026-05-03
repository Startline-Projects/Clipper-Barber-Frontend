import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Toggle from '@/components/ui/Toggle';
import Divider from '@/components/ui/Divider';
import Section from '@/components/ui/Section';
import Icon from '@/components/ui/Icon';
import Btn from '@/components/ui/Btn';
import TextField from '@/components/forms/TextField';
import { useColors } from '@/lib/theme/colors';
import {
  useServices,
  useCreateService,
  useUpdateService,
  useToggleService,
} from '@/lib/hooks/useServices';
import { toast } from '@/lib/stores/toast';
import type { Service, CreateServiceBody } from '@/lib/api/services';

const SERVICE_TYPES = [
  { value: 'haircut', label: 'Haircut' },
  { value: 'beard', label: 'Beard' },
  { value: 'haircut_beard', label: 'Haircut + Beard' },
  { value: 'eyebrows', label: 'Eyebrows' },
  { value: 'other', label: 'Other' },
] as const;

const DURATIONS = [15, 30, 45, 60] as const;

type ServiceType = (typeof SERVICE_TYPES)[number]['value'];

function formatPrice(cents: number): string {
  return `$${cents.toFixed(0)}`;
}

export default function ServicesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data: services, isLoading, isError, refetch } = useServices();
  const toggle = useToggleService();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-5">
          <Header title="Services" onBack={() => router.back()} />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.tertiary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !services) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-5">
          <Header title="Services" onBack={() => router.back()} />
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[15px] text-tertiary text-center mb-4">
            Could not load services
          </Text>
          <Pressable onPress={() => refetch()}>
            <Text className="text-[14px] font-semibold text-blue">Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const active = services.filter((s) => s.isActive);
  const inactive = services.filter((s) => !s.isActive);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1 px-5">
        <Header
          title="Services"
          onBack={() => router.back()}
          right={
            <Pressable
              onPress={() => {
                setEditingService(null);
                setEditorOpen(true);
              }}
            >
              <Icon name="plus" size={20} color={colors.ink} />
            </Pressable>
          }
        />

        {services.length === 0 ? (
          <View className="items-center py-16">
            <Icon name="scissors" size={40} color={colors.quaternary} />
            <Text className="text-[15px] text-tertiary mt-3">
              No services yet
            </Text>
            <Pressable
              onPress={() => {
                setEditingService(null);
                setEditorOpen(true);
              }}
              className="mt-4"
            >
              <Text className="text-[14px] font-semibold text-blue">
                Add your first service
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <Section title="Active">
                <Card elevated className="p-0 overflow-hidden">
                  {active.map((s, i) => (
                    <ServiceRow
                      key={s.id}
                      service={s}
                      last={i === active.length - 1}
                      onPress={() => {
                        setEditingService(s);
                        setEditorOpen(true);
                      }}
                      onToggle={() =>
                        toggle.mutate(s.id, {
                          onSuccess: () =>
                            toast.success(
                              s.isActive ? 'Service paused' : 'Service activated',
                            ),
                        })
                      }
                    />
                  ))}
                </Card>
              </Section>
            )}
            {inactive.length > 0 && (
              <Section title="Inactive">
                <Card elevated className="p-0 overflow-hidden">
                  {inactive.map((s, i) => (
                    <ServiceRow
                      key={s.id}
                      service={s}
                      last={i === inactive.length - 1}
                      onPress={() => {
                        setEditingService(s);
                        setEditorOpen(true);
                      }}
                      onToggle={() =>
                        toggle.mutate(s.id, {
                          onSuccess: () =>
                            toast.success(
                              s.isActive ? 'Service paused' : 'Service activated',
                            ),
                        })
                      }
                    />
                  ))}
                </Card>
              </Section>
            )}
          </>
        )}
      </ScrollView>

      <ServiceEditor
        visible={editorOpen}
        service={editingService}
        onClose={() => setEditorOpen(false)}
      />
    </SafeAreaView>
  );
}

function ServiceRow({
  service,
  last,
  onPress,
  onToggle,
}: {
  service: Service;
  last: boolean;
  onPress: () => void;
  onToggle: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-[14px] ${
        !last ? 'border-b border-separator' : ''
      }`}
    >
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-ink tracking-[-0.2px]">
          {service.name}
        </Text>
        <Text className="text-[13px] text-tertiary mt-[2px]">
          {service.durationMinutes}min · {formatPrice(service.regularPriceUsd)}
          {service.afterHoursPriceUsd != null &&
            ` · AH ${formatPrice(service.afterHoursPriceUsd)}`}
        </Text>
      </View>
      <View
        className="ml-3"
        onStartShouldSetResponder={() => true}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <Switch
          value={service.isActive}
          onValueChange={onToggle}
          trackColor={{ false: '#374151', true: '#22c55e' }}
          thumbColor="#ffffff"
        />
      </View>
      <View className="ml-2">
        <Icon name="chevron" size={16} color={colors.quaternary} />
      </View>
    </Pressable>
  );
}

function ServiceEditor({
  visible,
  service,
  onClose,
}: {
  visible: boolean;
  service: Service | null;
  onClose: () => void;
}) {
  const colors = useColors();
  const create = useCreateService();
  const update = useUpdateService();
  const isEdit = service !== null;

  const [name, setName] = useState('');
  const [type, setType] = useState<ServiceType>('haircut');
  const [duration, setDuration] = useState<15 | 30 | 45 | 60>(30);
  const [regularPrice, setRegularPrice] = useState('');
  const [afterHoursPrice, setAfterHoursPrice] = useState('');
  const [dayOffPrice, setDayOffPrice] = useState('');
  const [recurringPrice, setRecurringPrice] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  const priceRef1 = useRef<TextInput>(null);
  const priceRef2 = useRef<TextInput>(null);
  const priceRef3 = useRef<TextInput>(null);
  const priceRef4 = useRef<TextInput>(null);

  if (visible && service && !hydrated) {
    setName(service.name);
    setType(service.serviceType as ServiceType);
    setDuration(service.durationMinutes as 15 | 30 | 45 | 60);
    setRegularPrice(service.regularPriceUsd.toString());
    setAfterHoursPrice(service.afterHoursPriceUsd?.toString() ?? '');
    setDayOffPrice(service.dayOffPriceUsd?.toString() ?? '');
    setRecurringPrice(service.recurringPriceUsd?.toString() ?? '');
    setHydrated(true);
  }

  if (visible && !service && !hydrated) {
    setName('');
    setType('haircut');
    setDuration(30);
    setRegularPrice('');
    setAfterHoursPrice('');
    setDayOffPrice('');
    setRecurringPrice('');
    setHydrated(true);
  }

  const handleClose = () => {
    setHydrated(false);
    setErrors({});
    onClose();
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Required';
    if (!regularPrice.trim() || isNaN(Number(regularPrice)) || Number(regularPrice) <= 0)
      e.regularPrice = 'Enter a valid price';
    if (afterHoursPrice && (isNaN(Number(afterHoursPrice)) || Number(afterHoursPrice) <= 0))
      e.afterHoursPrice = 'Invalid price';
    if (dayOffPrice && (isNaN(Number(dayOffPrice)) || Number(dayOffPrice) <= 0))
      e.dayOffPrice = 'Invalid price';
    if (recurringPrice && (isNaN(Number(recurringPrice)) || Number(recurringPrice) <= 0))
      e.recurringPrice = 'Invalid price';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (create.isPending || update.isPending) return;
    if (!validate()) return;

    if (isEdit) {
      update.mutate(
        {
          serviceId: service.id,
          body: {
            name: name.trim(),
            serviceType: type,
            durationMinutes: duration,
            regularPriceUsd: Number(regularPrice),
            afterHoursPriceUsd: afterHoursPrice ? Number(afterHoursPrice) : null,
            dayOffPriceUsd: dayOffPrice ? Number(dayOffPrice) : null,
            recurringPriceUsd: recurringPrice ? Number(recurringPrice) : null,
          },
        },
        { onSuccess: handleClose },
      );
    } else {
      const body: CreateServiceBody = {
        name: name.trim(),
        serviceType: type,
        durationMinutes: duration,
        regularPriceUsd: Number(regularPrice),
      };
      if (afterHoursPrice) body.afterHoursPriceUsd = Number(afterHoursPrice);
      if (dayOffPrice) body.dayOffPriceUsd = Number(dayOffPrice);
      if (recurringPrice) body.recurringPriceUsd = Number(recurringPrice);
      create.mutate(body, { onSuccess: handleClose });
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={handleClose}
        >
          <Pressable
            className="bg-surface rounded-t-3xl px-5 pt-4 pb-8 max-h-[85%]"
            onPress={() => {}}
          >
            <View className="w-10 h-1 rounded-full bg-separator-opaque self-center mb-[18px]" />
            <Text className="text-[22px] font-extrabold text-ink tracking-[-0.5px] mb-4">
              {isEdit ? 'Edit Service' : 'New Service'}
            </Text>

            <ScrollView keyboardShouldPersistTaps="handled">
              <View className="mb-4">
                <TextField
                  label="Service Name"
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    if (errors.name) setErrors((e) => ({ ...e, name: '' }));
                  }}
                  placeholder="e.g. Classic Haircut"
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => priceRef1.current?.focus()}
                  blurOnSubmit={false}
                  error={errors.name}
                />
              </View>

              {/* Service type */}
              <Text className="text-[12px] font-semibold text-tertiary tracking-[0.2px] uppercase mb-[6px]">
                Type
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {SERVICE_TYPES.map((t) => (
                  <Pressable
                    key={t.value}
                    onPress={() => setType(t.value)}
                    className={`px-4 py-[10px] rounded-sm active:opacity-70 ${
                      type === t.value
                        ? 'bg-green'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <Text
                      className={`text-[13px] font-semibold ${
                        type === t.value
                          ? 'text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Duration */}
              <Text className="text-[12px] font-semibold text-tertiary tracking-[0.2px] uppercase mb-[6px]">
                Duration
              </Text>
              <View className="flex-row gap-2 mb-4">
                {DURATIONS.map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setDuration(d)}
                    className={`flex-1 py-[10px] rounded-sm items-center active:opacity-70 ${
                      duration === d
                        ? 'bg-green'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <Text
                      className={`text-[13px] font-semibold ${
                        duration === d
                          ? 'text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {d}m
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Prices */}
              <Text className="text-[12px] font-semibold text-tertiary tracking-[0.2px] uppercase mb-[6px]">
                Pricing
              </Text>
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <TextField
                    ref={priceRef1}
                    label="Regular"
                    value={regularPrice}
                    onChangeText={(t) => {
                      setRegularPrice(t);
                      if (errors.regularPrice)
                        setErrors((e) => ({ ...e, regularPrice: '' }));
                    }}
                    placeholder="$30"
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => priceRef2.current?.focus()}
                    blurOnSubmit={false}
                    error={errors.regularPrice}
                  />
                </View>
                <View className="flex-1">
                  <TextField
                    ref={priceRef2}
                    label="After-Hours"
                    value={afterHoursPrice}
                    onChangeText={(t) => {
                      setAfterHoursPrice(t);
                      if (errors.afterHoursPrice)
                        setErrors((e) => ({ ...e, afterHoursPrice: '' }));
                    }}
                    placeholder="Optional"
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => priceRef3.current?.focus()}
                    blurOnSubmit={false}
                    error={errors.afterHoursPrice}
                  />
                </View>
              </View>
              <View className="flex-row gap-3 mb-6">
                <View className="flex-1">
                  <TextField
                    ref={priceRef3}
                    label="Day-Off"
                    value={dayOffPrice}
                    onChangeText={(t) => {
                      setDayOffPrice(t);
                      if (errors.dayOffPrice)
                        setErrors((e) => ({ ...e, dayOffPrice: '' }));
                    }}
                    placeholder="Optional"
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => priceRef4.current?.focus()}
                    blurOnSubmit={false}
                    error={errors.dayOffPrice}
                  />
                </View>
                <View className="flex-1">
                  <TextField
                    ref={priceRef4}
                    label="Recurring"
                    value={recurringPrice}
                    onChangeText={(t) => {
                      setRecurringPrice(t);
                      if (errors.recurringPrice)
                        setErrors((e) => ({ ...e, recurringPrice: '' }));
                    }}
                    placeholder="Optional"
                    keyboardType="numeric"
                    error={errors.recurringPrice}
                  />
                </View>
              </View>

              <Btn
                label={pending ? 'Saving...' : isEdit ? 'Update Service' : 'Create Service'}
                full
                onPress={handleSave}
                disabled={pending}
              />
              <View className="mt-2 mb-4">
                <Btn label="Cancel" variant="ghost" full onPress={handleClose} />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
