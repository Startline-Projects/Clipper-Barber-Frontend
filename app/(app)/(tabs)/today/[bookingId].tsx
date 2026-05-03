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
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  useNoShowBooking,
} from '@/lib/hooks/useBookings';
import { useStartConversation } from '@/lib/hooks/useConversations';
import { toast } from '@/lib/stores/toast';
import { getReadableError } from '@/lib/utils/get-readable-error';

const TYPE_LABELS: Record<string, string> = {
  regular: 'Regular',
  after_hours: 'After-Hours',
  day_off: 'Day-Off',
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const time = `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  const date = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return `${date} · ${time}`;
}

export default function BookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const colors = useColors();
  const cancelMut = useCancelBooking();
  const noShowMut = useNoShowBooking();
  const startConvo = useStartConversation();
  const [showNoShowSheet, setShowNoShowSheet] = useState(false);

  const { data, isLoading } = useBookingDetail(bookingId ?? '');
  const b = data?.booking;

  if (isLoading || !b) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-5">
          <Header title="" onBack={() => router.back()} />
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
              router.back();
            },
          }),
      },
    ]);
  };

  const handleNoShow = () => setShowNoShowSheet(true);

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
        router.back();
      },
    });
  };

  const rows: [string, string][] = [
    ['Service', b.service.name],
    ['Time', formatDateTime(b.scheduledAt)],
    ['Duration', `${b.service.durationMinutes} min`],
    ['Type', TYPE_LABELS[b.bookingType] ?? b.bookingType],
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1 px-5">
        <Header title="" onBack={() => router.back()} />

        {/* Client header */}
        <View className="items-center pb-6">
          <Avatar name={b.client.name} size={64} />
          <Text className="text-[22px] font-bold text-ink tracking-[-0.5px] mt-3 mb-[6px]">
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
              <Text className="text-[14px] text-tertiary">{label}</Text>
              <Text className="text-[15px] font-semibold text-ink tracking-[-0.2px]">
                {value}
              </Text>
            </View>
          ))}
          <View className="flex-row justify-between py-[10px] border-t border-separator">
            <Text className="text-[14px] text-tertiary">Price</Text>
            <Text className="text-[22px] font-extrabold text-ink tracking-[-0.5px]">
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
            <Text className="text-[22px] font-extrabold text-ink tracking-[-0.5px] text-center">
              Charge no-show fee?
            </Text>
            <Text className="text-[14px] text-secondary text-center leading-[20px] tracking-[-0.1px] mt-2 mb-[18px] px-2">
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
