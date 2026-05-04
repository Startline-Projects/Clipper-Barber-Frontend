import { forwardRef, useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import Icon, { type IconName } from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';

interface PhotoPickerSheetProps {
  hasPhoto?: boolean;
  onTakePhoto: () => void;
  onChooseLibrary: () => void;
  onRemovePhoto: () => void;
  onCancel: () => void;
}

interface OptionDef {
  icon: IconName;
  label: string;
  action: 'take' | 'choose' | 'remove';
  destructive?: boolean;
}

const PhotoPickerSheet = forwardRef<BottomSheet, PhotoPickerSheetProps>(
  function PhotoPickerSheet(
    { hasPhoto, onTakePhoto, onChooseLibrary, onRemovePhoto, onCancel },
    ref,
  ) {
    const colors = useColors();
    const snapPoints = useMemo(() => ['35%'], []);

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1) onCancel();
      },
      [onCancel],
    );

    const options: OptionDef[] = [
      { icon: 'camera', label: 'Take photo', action: 'take' },
      { icon: 'image', label: 'Choose from library', action: 'choose' },
      ...(hasPhoto
        ? [
            {
              icon: 'trash' as IconName,
              label: 'Remove photo',
              action: 'remove' as const,
              destructive: true,
            },
          ]
        : []),
    ];

    const handlers = {
      take: onTakePhoto,
      choose: onChooseLibrary,
      remove: onRemovePhoto,
    };

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
        <BottomSheetView className="px-6 pb-10 pt-2">
          <Text className="text-[18px] font-bold text-ink tracking-[-0.3px] mb-1">
            Profile photo
          </Text>
          <Text className="text-[14px] text-secondary mb-5">
            Update your profile picture
          </Text>

          <View className="gap-1">
            {options.map((opt) => (
              <Pressable
                key={opt.action}
                onPress={handlers[opt.action]}
                className="flex-row items-center gap-3 py-[14px] px-1 active:opacity-70"
              >
                <Icon
                  name={opt.icon}
                  size={22}
                  color={opt.destructive ? colors.red : colors.primary}
                />
                <Text
                  className={`text-[16px] tracking-[-0.2px] ${
                    opt.destructive
                      ? 'text-red font-medium'
                      : 'text-ink font-medium'
                  }`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

export default PhotoPickerSheet;
