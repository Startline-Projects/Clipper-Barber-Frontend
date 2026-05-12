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
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import TypeBadge from '@/components/ui/TypeBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Btn from '@/components/ui/Btn';
import { useColors } from '@/lib/theme/colors';
import {
  useBookingDetail,
  useCancelBooking,
  useCompleteBooking,
  useNoShowBooking,
} from '@/lib/hooks/useBookings';
import { useStartConversation } from '@/lib/hooks/useConversations';
import { toast } from '@/lib/stores/toast';
import { getReadableError } from '@/lib/utils/get-readable-error';
import { formatBookingDateTime } from '@/lib/utils/timezone';

const TYPE_LABELS: Record<string, string> = {
  regular: 'Regular',
  after_hours: 'After-Hours',
  day_off: 'Day-Off',
};

export default function BookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const segments = useSegments() as string[];
  const colors = useColors();
  const cancelMut = useCancelBooking();
  const completeMut = useCompleteBooking();
  const noShowMut = useNoShowBooking();
  const startConvo = useStartConversation();
  const [showNoShowSheet, setShowNoShowSheet] = useState(false);

  const { data, isLoading } = useBookingDetail(bookingId ?? '');
  const b = data?.booking;

  // This screen is re-exported into today/, bookings/, and calendar/ tabs.
  // Route back to the list of whichever tab we're currently on, since the
  // tab-press listener uses router.replace and can leave the in-tab stack empty.
  const goBack = () => {
    const tab = segments.find((s) => s === 'bookings' || s === 'calendar' || s === 'today');
    if (tab) {
      router.replace(`/(app)/(tabs)/${tab}` as any);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/(tabs)/today');
    }
  };

  if (isLoading || !b) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-5">
          <Header title="" onBack={goBack} />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.tertiary} />
        </View>
      </SafeAreaView>
    );
  }

  const handleCancel = () => {
    Alert.alert('Cancel booking?', `${b.client.name}'s appointment will be cancelled.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Booking',
        style: 'destructive',
        onPress: () =>
          cancelMut.mutate(b.id, {
            onSuccess: () => {
              toast.success('Booking cancelled');
              goBack();
            },
          }),
      },
    ]);
  };

  const handleNoShow = () => setShowNoShowSheet(true);

  const handleComplete = () => {
    Alert.alert('Mark as completed?', `${b.client.name}'s appointment will be marked completed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Completed',
        onPress: () =>
          completeMut.mutate(b.id, {
            onSuccess: () => {
              toast.success('Booking marked completed');
              goBack();
            },
            onError: (err) => toast.error(getReadableError(err)),
          }),
      },
    ]);
  };

  const handleMessage = () => {
    if (startConvo.isPending) return;
    startConvo.mutate(b.client.id, {
      onSuccess: (convo) => {
        router.push(`/(app)/(tabs)/messages/${convo.id}`);
      },
      onError: (err) => {
        toast.error(getReadableError(err));
      },
    });
  };

  const confirmNoShow = () => {
    noShowMut.mutate(b.id, {
      onSuccess: () => {
        setShowNoShowSheet(false);
        toast.success(
          b.noShowChargeAmountUsd
            ? `No-show recorded · $${b.noShowChargeAmountUsd} charged`
            : 'No-show recorded',
        );
        goBack();
      },
    });
  };

  // Multi-service: prefer services[] when present; otherwise fall back to
  // the legacy single service. Total duration = totalDurationMinutes when
  // provided, else service.durationMinutes (which on new responses is
  // also the total block, and on legacy responses is the single duration).
  const serviceList =
    b.services && b.services.length > 0
      ? b.services
      : [{ id: 'legacy', name: b.service.name, durationMinutes: b.service.durationMinutes, bookingType: b.bookingType, startOffsetMinutes: 0 }];
  const totalDuration = b.totalDurationMinutes ?? b.service.durationMinutes;
  const serviceLabel = serviceList.map((s) => s.name).join(' + ');

  const rows: [string, string][] = [
    ['Service', serviceLabel],
    ['Time', formatBookingDateTime(b)],
    ['Total Duration', `${totalDuration} min`],
    ['Type', TYPE_LABELS[b.bookingType] ?? b.bookingType],
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1 px-5">
        <Header title="" onBack={goBack} />

        {/* Client header */}
        <View className="items-center pb-6">
          <Avatar name={b.client.name} size={64} />
          <Text className="text-3xl font-bold text-ink tracking-[-0.5px] mt-3 mb-[6px]">
            {b.client.name}
          </Text>
          <View className="flex-row gap-[6px]">
            <TypeBadge type={b.bookingType} />
            <StatusBadge status={b.status} />
            {b.isRecurring && (
              <Badge bg={colors.blue + '14'} color={colors.blue} label="Recurring" />
            )}
          </View>
        </View>

        {/* Detail card */}
        <Card elevated>
          {rows.map(([label, value], i) => (
            <View
              key={label}
              className={`flex-row justify-between py-[10px] ${
                i > 0 ? 'border-t border-separator' : ''
              }`}
            >
              <Text className="text-md text-tertiary">{label}</Text>
              <Text className="text-lg font-semibold text-ink tracking-[-0.2px]">
                {value}
              </Text>
            </View>
          ))}
          {serviceList.length > 1 && (
            <View className="py-[10px] border-t border-separator">
              <Text className="text-md text-tertiary mb-2">Services</Text>
              {serviceList.map((s) => (
                <View
                  key={s.id}
                  className="flex-row justify-between py-[4px]"
                >
                  <Text className="text-base text-ink">{s.name}</Text>
                  <Text className="text-base text-secondary">
                    {s.durationMinutes} min
                  </Text>
                </View>
              ))}
            </View>
          )}
          <View className="flex-row justify-between py-[10px] border-t border-separator">
            <Text className="text-md text-tertiary">Price</Text>
            <Text className="text-3xl font-extrabold text-ink tracking-[-0.5px]">
              ${b.pricing.totalPrice}
            </Text>
          </View>
        </Card>

        {/* Actions */}
        <View className="flex-row gap-[10px] mt-xl">
          <View className="flex-1">
            <Btn
              label={startConvo.isPending ? 'Opening...' : 'Message'}
              full
              disabled={startConvo.isPending}
              onPress={handleMessage}
            />
          </View>
          {b.status === 'confirmed' && (
            <View className="flex-1">
              <Btn label="Cancel" variant="danger" full onPress={handleCancel} />
            </View>
          )}
        </View>

        {b.status === 'confirmed' && (
          <>
            <View className="mt-sm">
              <Btn
                label={completeMut.isPending ? 'Marking...' : 'Mark Completed'}
                full
                disabled={completeMut.isPending}
                onPress={handleComplete}
              />
            </View>
            <View className="mt-sm mb-8">
              <Btn
                label={
                  b.noShowChargeAmountUsd
                    ? `Mark No-Show · Charge $${b.noShowChargeAmountUsd}`
                    : 'Mark No-Show'
                }
                variant="ghost"
                full
                onPress={handleNoShow}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* No-show confirmation sheet */}
      <Modal
        visible={showNoShowSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNoShowSheet(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowNoShowSheet(false)}
        >
          <Pressable
            className="bg-surface rounded-t-3xl px-5 pt-5 pb-8"
            onPress={() => {}}
          >
            <View className="w-10 h-1 rounded-full bg-separator-opaque self-center mb-[18px]" />
            <View className="w-14 h-14 rounded-full bg-red/10 items-center justify-center self-center mb-[14px]">
              <Icon name="alert" size={28} color={colors.red} />
            </View>
            <Text className="text-3xl font-extrabold text-ink tracking-[-0.5px] text-center">
              Charge no-show fee?
            </Text>
            <Text className="text-md text-secondary text-center leading-[20px] tracking-[-0.1px] mt-2 mb-[18px] px-2">
              {b.noShowChargeAmountUsd
                ? `$${b.noShowChargeAmountUsd} will be charged to ${b.client.name}'s saved card via Stripe. They'll get an automatic receipt.`
                : `${b.client.name} will be marked as a no-show.`}
            </Text>
            <View className="flex-row gap-[10px]">
              <View className="flex-1">
                <Btn
                  label="Cancel"
                  variant="ghost"
                  full
                  onPress={() => setShowNoShowSheet(false)}
                />
              </View>
              <View className="flex-[2]">
                <Btn
                  label={
                    b.noShowChargeAmountUsd
                      ? `Charge $${b.noShowChargeAmountUsd}`
                      : 'Confirm No-Show'
                  }
                  full
                  onPress={confirmNoShow}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
