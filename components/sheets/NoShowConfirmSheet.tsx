import { forwardRef, useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';

interface NoShowConfirmSheetProps {
  fee: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const NoShowConfirmSheet = forwardRef<BottomSheet, NoShowConfirmSheetProps>(
  function NoShowConfirmSheet({ fee, onConfirm, onCancel }, ref) {
    const colors = useColors();
    const snapPoints = useMemo(() => ['35%'], []);

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1) onCancel();
      },
      [onCancel],
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={handleSheetChanges}
        backgroundStyle={{ backgroundColor: colors.card }}
        handleIndicatorStyle={{ backgroundColor: colors.quaternary }}
      >
        <BottomSheetView className="px-6 pb-10 pt-2 items-center">
          <View className="w-[52px] h-[52px] rounded-full bg-red/10 items-center justify-center mb-4">
            <Icon name="alert" size={26} color={colors.red} />
          </View>

          <Text className="text-[18px] font-bold text-ink tracking-[-0.3px] mb-2">
            Charge no-show fee?
          </Text>
          <Text className="text-[14px] text-secondary text-center leading-[20px] mb-6">
            This will charge the client a ${fee} no-show fee. This action cannot
            be undone.
          </Text>

          <View className="flex-row gap-3 w-full">
            <Pressable
              onPress={onCancel}
              className="flex-1 items-center py-[14px] rounded-md bg-bg border-[1.5px] border-separator-opaque active:opacity-70"
            >
              <Text className="text-[15px] font-semibold text-ink">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              className="flex-1 flex-row items-center justify-center gap-[6px] py-[14px] rounded-md bg-red active:opacity-70"
            >
              <Icon name="dollar" size={16} color="#FFF" />
              <Text className="text-[15px] font-semibold text-white">
                Charge ${fee}
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

export default NoShowConfirmSheet;
