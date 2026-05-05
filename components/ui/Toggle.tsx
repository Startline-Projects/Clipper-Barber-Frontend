import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/lib/theme/colors';

interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  label: string;
  sub?: string;
}

const TRACK_W = 50;
const TRACK_H = 30;
const THUMB = 26;
const TIMING = { duration: 250 };

export default function Toggle({ on, onToggle, label, sub }: ToggleProps) {
  const colors = useColors();

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(on ? TRACK_W - THUMB - 2 : 2, TIMING) },
    ],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(on ? colors.green : colors.separatorOpaque, TIMING),
  }));

  return (
    <Pressable
      onPress={onToggle}
      className="flex-row items-center justify-between py-[11px] gap-3"
    >
      <View className="flex-1">
        <Text className="text-lg font-medium text-ink tracking-[-0.2px]">
          {label}
        </Text>
        {sub && (
          <Text className="text-sm text-tertiary mt-[2px] leading-[16px]">
            {sub}
          </Text>
        )}
      </View>

      <Animated.View
        style={[
          {
            width: TRACK_W,
            height: TRACK_H,
            borderRadius: TRACK_H / 2,
          },
          trackStyle,
        ]}
        className="shrink-0 justify-center"
      >
        <Animated.View
          style={[
            {
              width: THUMB,
              height: THUMB,
              borderRadius: THUMB / 2,
              backgroundColor: colors.surface,
            },
            thumbStyle,
          ]}
          className="shadow-sm shadow-black/[0.12]"
        />
      </Animated.View>
    </Pressable>
  );
}
