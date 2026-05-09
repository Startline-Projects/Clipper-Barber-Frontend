import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import Btn from '@/components/ui/Btn';
import Pill from '@/components/ui/Pill';

export interface PauseRecurringBody {
  pauseStartDate: string;
  pauseEndDate?: string;
}

interface Props {
  visible: boolean;
  subtitle?: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (body: PauseRecurringBody) => void;
}

const FROM_OPTIONS = ['Today', 'Next visit', 'Pick a date'];
const UNTIL_OPTIONS = ['1 week', '2 weeks', '1 month', 'Until I resume'];

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function PauseRecurringDrawer({
  visible,
  subtitle,
  isPending,
  onClose,
  onConfirm,
}: Props) {
  const [from, setFrom] = useState('Today');
  const [until, setUntil] = useState('2 weeks');
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    const today = new Date();
    const startDate = toIsoDate(today);
    let endDate: string | undefined;

    if (until === '1 week') {
      const d = new Date(today);
      d.setDate(d.getDate() + 7);
      endDate = toIsoDate(d);
    } else if (until === '2 weeks') {
      const d = new Date(today);
      d.setDate(d.getDate() + 14);
      endDate = toIsoDate(d);
    } else if (until === '1 month') {
      const d = new Date(today);
      d.setMonth(d.getMonth() + 1);
      endDate = toIsoDate(d);
    }

    onConfirm({ pauseStartDate: startDate, pauseEndDate: endDate });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Pressable className="bg-surface rounded-t-3xl px-5 pt-4 pb-8" onPress={() => {}}>
          <View className="w-10 h-1 rounded-full bg-separator-opaque self-center mb-[18px]" />
          <Text className="text-3xl font-extrabold text-ink tracking-[-0.5px]">
            Pause recurring
          </Text>
          {subtitle ? (
            <Text className="text-base text-secondary tracking-[-0.1px] mt-1 mb-[18px]">
              {subtitle}
            </Text>
          ) : (
            <View className="mb-[18px]" />
          )}

          <Text className="text-xs font-bold text-tertiary tracking-[0.3px] uppercase mb-2">
            Pause starting
          </Text>
          <View className="flex-row flex-wrap gap-[6px] mb-4">
            {FROM_OPTIONS.map((o) => (
              <Pill key={o} label={o} active={from === o} onPress={() => setFrom(o)} />
            ))}
          </View>

          <Text className="text-xs font-bold text-tertiary tracking-[0.3px] uppercase mb-2">
            For how long
          </Text>
          <View className="flex-row flex-wrap gap-[6px] mb-4">
            {UNTIL_OPTIONS.map((o) => (
              <Pill key={o} label={o} active={until === o} onPress={() => setUntil(o)} />
            ))}
          </View>

          <Text className="text-xs font-bold text-tertiary tracking-[0.3px] uppercase mb-2">
            Note for client (optional)
          </Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Out of town, family emergency, etc."
            multiline
            numberOfLines={3}
            className="w-full px-[14px] py-3 rounded-sm border-[1.5px] border-separator-opaque bg-surface text-md text-ink tracking-[-0.1px] mb-[14px]"
          />

          <View className="p-3 rounded-sm bg-orange/[0.08] border border-orange/20 mb-4">
            <Text className="text-base text-secondary leading-[20px] tracking-[-0.1px]">
              All upcoming visits in this window will be cancelled. Your recurring
              slot resumes automatically after.
            </Text>
          </View>

          <View className="flex-row gap-[10px]">
            <View className="flex-1">
              <Btn label="Cancel" variant="ghost" full onPress={onClose} />
            </View>
            <View className="flex-[2]">
              <Btn
                label={isPending ? 'Pausing...' : 'Pause'}
                full
                onPress={handleConfirm}
                disabled={isPending}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
