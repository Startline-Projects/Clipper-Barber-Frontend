import { forwardRef, useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';

interface PauseRecurringSheetProps {
  clientName: string;
  onPause: (pauseEndDate?: string) => void;
  onCancel: () => void;
}

const durations = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: 'Indefinitely', days: 0 },
] as const;

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const PauseRecurringSheet = forwardRef<BottomSheet, PauseRecurringSheetProps>(
  function PauseRecurringSheet({ clientName, onPause, onCancel }, ref) {
    const colors = useColors();
    const [selected, setSelected] = useState(0);

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1) onCancel();
      },
      [onCancel],
    );

    const handlePause = useCallback(() => {
      const d = durations[selected];
      onPause(d.days > 0 ? addDays(d.days) : undefined);
    }, [selected, onPause]);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        enablePanDownToClose
        enableDynamicSizing
        onChange={handleSheetChanges}
        backgroundStyle={{ backgroundColor: colors.card }}
        handleIndicatorStyle={{ backgroundColor: colors.quaternary }}
      >
        <BottomSheetView className="px-6 pb-10 pt-2">
          <Text className="text-[18px] font-bold text-ink tracking-[-0.3px] mb-1">
            Pause recurring
          </Text>
          <Text className="text-[14px] text-secondary mb-5">
            Pause {clientName}'s recurring booking
          </Text>

          <View className="gap-[10px] mb-6">
            {durations.map((d, i) => (
              <Pressable
                key={d.label}
                onPress={() => setSelected(i)}
                className={`flex-row items-center py-[14px] px-4 rounded-md border-[1.5px] active:opacity-70 ${
                  selected === i
                    ? 'border-ink bg-ink/[0.03]'
                    : 'border-separator-opaque'
                }`}
              >
                <Text
                  className={`flex-1 text-[15px] tracking-[-0.2px] ${
                    selected === i
                      ? 'font-semibold text-ink'
                      : 'font-medium text-secondary'
                  }`}
                >
                  {d.label}
                </Text>
                {selected === i && (
                  <Icon name="check" size={18} color={colors.ink} />
                )}
              </Pressable>
            ))}
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 items-center py-[14px] rounded-md bg-bg border-[1.5px] border-separator-opaque active:opacity-70"
            >
              <Text className="text-[15px] font-semibold text-ink">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handlePause}
              className="flex-1 flex-row items-center justify-center gap-[6px] py-[14px] rounded-md bg-orange active:opacity-70"
            >
              <Icon name="clock" size={16} color="#FFF" />
              <Text className="text-[15px] font-semibold text-white">
                Pause
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

export default PauseRecurringSheet;
