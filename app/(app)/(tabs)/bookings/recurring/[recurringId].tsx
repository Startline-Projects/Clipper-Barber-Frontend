import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Section from '@/components/ui/Section';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import Divider from '@/components/ui/Divider';
import Btn from '@/components/ui/Btn';
import StatusBadge from '@/components/ui/StatusBadge';
import { useColors } from '@/lib/theme/colors';
import {
  useRecurringDetail,
  useAcceptRecurring,
  useDeclineRecurring,
  usePauseRecurring,
  useResumeRecurring,
  useCancelRecurring,
} from '@/lib/hooks/useRecurring';
import { toast } from '@/lib/stores/toast';
import { getReadableError } from '@/lib/utils/get-readable-error';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

export default function RecurringDetailScreen() {
  const { recurringId } = useLocalSearchParams<{ recurringId: string }>();
  const router = useRouter();
  const colors = useColors();
  const { data, isLoading, isError, error } = useRecurringDetail(recurringId ?? '');
  const accept = useAcceptRecurring();
  const decline = useDeclineRecurring();
  const pause = usePauseRecurring();
  const resume = useResumeRecurring();
  const cancel = useCancelRecurring();

  const [pauseDrawer, setPauseDrawer] = useState(false);
  const [pauseNote, setPauseNote] = useState('');

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-5">
          <Header title="Recurring" onBack={() => router.back()} />
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
          <Header title="Recurring" onBack={() => router.back()} />
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-lg text-tertiary text-center">
            {getReadableError(error)}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const r = data.recurringBooking;
  const isPending = r.status === 'pending_barber_approval';
  const isActive = r.status === 'active';
  const isPaused = r.status === 'paused';

  const handleAccept = () => {
    accept.mutate(r.id, {
      onSuccess: () => {
        toast.success('Recurring accepted');
        router.back();
      },
    });
  };

  const handleDecline = () => {
    Alert.alert('Decline this recurring?', 'The client will be notified.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () =>
          decline.mutate(
            { recurringId: r.id },
            {
              onSuccess: () => {
                toast.success('Recurring declined');
                router.back();
              },
            },
          ),
      },
    ]);
  };

  const handlePause = () => {
    const now = new Date();
    pause.mutate(
      {
        recurringId: r.id,
        body: { pauseStartDate: now.toISOString() },
      },
      {
        onSuccess: () => {
          setPauseDrawer(false);
          toast.success('Recurring paused');
        },
      },
    );
  };

  const handleResume = () => {
    resume.mutate(r.id, {
      onSuccess: () => {
        toast.success('Recurring resumed');
        router.back();
      },
    });
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel recurring?',
      'This will permanently end this recurring arrangement.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel it',
          style: 'destructive',
          onPress: () =>
            cancel.mutate(r.id, {
              onSuccess: () => {
                toast.success('Recurring cancelled');
                router.back();
              },
            }),
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1 px-5">
        <Header title="Recurring Detail" onBack={() => router.back()} />

        {/* Client + status */}
        <View className="items-center pb-4">
          <Avatar name={r.client.name} size={64} />
          <Text className="text-2xl font-bold text-ink tracking-[-0.4px] mt-3">
            {r.client.name}
          </Text>
          <View className="flex-row items-center gap-2 mt-2">
            <View
              className={`px-[8px] py-[3px] rounded-xs ${
                isActive
                  ? 'bg-green/12'
                  : isPaused
                    ? 'bg-orange/12'
                    : isPending
                      ? 'bg-blue/12'
                      : 'bg-separator-opaque'
              }`}
            >
              <Text
                className={`text-xs font-bold tracking-[0.3px] ${
                  isActive
                    ? 'text-green'
                    : isPaused
                      ? 'text-orange'
                      : isPending
                        ? 'text-blue'
                        : 'text-tertiary'
                }`}
              >
                {r.status.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
            {r.isRenewal && (
              <View className="px-[8px] py-[3px] rounded-xs bg-purple/12">
                <Text className="text-xs font-bold text-purple tracking-[0.3px]">
                  RENEWAL
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Details card */}
        <Card elevated>
          <DetailRow label="Service" value={r.service.name} />
          <Divider />
          <DetailRow label="Day" value={DAY_LABELS[r.dayOfWeek]} />
          <Divider />
          <DetailRow label="Time" value={r.slotTime} />
          <Divider />
          <DetailRow label="Frequency" value={r.frequency === 'weekly' ? 'Weekly' : 'Biweekly'} />
          <Divider />
          <DetailRow label="Duration" value={`${r.totalDurationMinutes} min`} />
          <Divider />
          <DetailRow label="Price" value={`$${r.priceUsd.toFixed(0)}`} bold />
          {r.nextOccurrenceAt && (
            <>
              <Divider />
              <DetailRow label="Next" value={formatDate(r.nextOccurrenceAt)} />
            </>
          )}
          {r.pauseStartDate && (
            <>
              <Divider />
              <DetailRow
                label="Paused from"
                value={formatDate(r.pauseStartDate)}
              />
            </>
          )}
          {r.pauseEndDate && (
            <>
              <Divider />
              <DetailRow
                label="Resumes"
                value={formatDate(r.pauseEndDate)}
              />
            </>
          )}
        </Card>

        {/* Actions */}
        {isPending && (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Btn
                label="Decline"
                variant="ghost"
                full
                onPress={handleDecline}
              />
            </View>
            <View className="flex-1">
              <Btn
                label={accept.isPending ? 'Accepting...' : 'Accept'}
                full
                onPress={handleAccept}
                disabled={accept.isPending}
              />
            </View>
          </View>
        )}

        {isActive && (
          <View className="gap-3">
            <Btn label="Pause" variant="ghost" full onPress={() => setPauseDrawer(true)} />
            <Btn
              label="Cancel Recurring"
              variant="ghost"
              full
              onPress={handleCancel}
            />
          </View>
        )}

        {isPaused && (
          <View className="gap-3">
            <Btn
              label={resume.isPending ? 'Resuming...' : 'Resume'}
              full
              onPress={handleResume}
              disabled={resume.isPending}
            />
            <Btn
              label="Cancel Recurring"
              variant="ghost"
              full
              onPress={handleCancel}
            />
          </View>
        )}

        {/* Upcoming occurrences */}
        {r.upcomingOccurrences.length > 0 && (
          <Section title="Upcoming" className="mt-lg">
            <Card elevated className="p-0 overflow-hidden">
              {r.upcomingOccurrences.map((occ, i) => (
                <Pressable
                  key={occ.bookingId}
                  onPress={() =>
                    router.push(`/(app)/(tabs)/bookings/${occ.bookingId}`)
                  }
                  className={`flex-row items-center justify-between px-4 py-[12px] ${
                    i < r.upcomingOccurrences.length - 1
                      ? 'border-b border-separator'
                      : ''
                  }`}
                >
                  <Text className="text-md text-ink font-medium">
                    {formatDate(occ.scheduledAt)}
                  </Text>
                  <StatusBadge status={occ.status} />
                </Pressable>
              ))}
            </Card>
          </Section>
        )}

        {/* Past occurrences */}
        {r.pastOccurrences.length > 0 && (
          <Section title="Past">
            <Card elevated className="p-0 overflow-hidden">
              {r.pastOccurrences.slice(0, 10).map((occ, i) => (
                <View
                  key={occ.bookingId}
                  className={`flex-row items-center justify-between px-4 py-[12px] ${
                    i < Math.min(r.pastOccurrences.length, 10) - 1
                      ? 'border-b border-separator'
                      : ''
                  }`}
                >
                  <Text className="text-md text-tertiary">
                    {formatDate(occ.scheduledAt)}
                  </Text>
                  <StatusBadge status={occ.status} />
                </View>
              ))}
            </Card>
          </Section>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Pause drawer */}
      <Modal
        visible={pauseDrawer}
        transparent
        animationType="slide"
        onRequestClose={() => setPauseDrawer(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setPauseDrawer(false)}
        >
          <Pressable className="bg-surface rounded-t-3xl px-5 pt-4 pb-8" onPress={() => {}}>
            <View className="w-10 h-1 rounded-full bg-separator-opaque self-center mb-[18px]" />
            <Text className="text-3xl font-extrabold text-ink tracking-[-0.5px]">
              Pause Recurring
            </Text>
            <Text className="text-base text-secondary mt-1 mb-4">
              Pause this arrangement starting today. The client will be notified.
            </Text>

            <View className="p-3 rounded-md bg-orange/8 border border-orange/20 mb-4">
              <View className="flex-row items-center gap-2 mb-1">
                <Icon name="alert" size={14} color={colors.orange} />
                <Text className="text-base font-semibold text-orange">
                  Upcoming bookings will be skipped
                </Text>
              </View>
              <Text className="text-sm text-secondary leading-[17px]">
                No new bookings will be created until the arrangement is resumed.
              </Text>
            </View>

            <Btn
              label={pause.isPending ? 'Pausing...' : 'Pause Now'}
              full
              onPress={handlePause}
              disabled={pause.isPending}
            />
            <View className="mt-2">
              <Btn
                label="Cancel"
                variant="ghost"
                full
                onPress={() => setPauseDrawer(false)}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-[11px]">
      <Text className="text-md text-secondary">{label}</Text>
      <Text
        className={`text-md tracking-[-0.1px] ${
          bold ? 'font-bold text-[16px]' : 'font-semibold'
        } text-ink`}
      >
        {value}
      </Text>
    </View>
  );
}
