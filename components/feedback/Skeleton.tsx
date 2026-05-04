import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export function Skeleton({ className }: { className?: string }) {
  const translateX = useSharedValue(-200);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    translateX.value = withRepeat(withTiming(200, { duration: 1000 }), -1, false);
    return () => cancelAnimation(translateX);
  }, []);

  return (
    <View className={`overflow-hidden bg-quaternary rounded-xs ${className ?? ''}`}>
      <Animated.View
        style={[{ position: 'absolute', top: 0, bottom: 0, width: '100%' }, animatedStyle]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.12)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

export function SkeletonBookingCard() {
  return (
    <View className="mb-3 p-4 rounded-md bg-surface">
      <View className="flex-row items-center gap-3">
        <Skeleton className="w-[42px] h-[42px] rounded-full" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-4 w-3/4 rounded-xs" />
          <Skeleton className="h-3 w-1/2 rounded-xs" />
        </View>
        <Skeleton className="h-5 w-10 rounded-xs" />
      </View>
    </View>
  );
}

export function SkeletonConversationRow() {
  return (
    <View className="flex-row items-center gap-3 px-4 py-[14px] border-b-[0.5px] border-separator">
      <Skeleton className="w-[46px] h-[46px] rounded-full" />
      <View className="flex-1 gap-2">
        <Skeleton className="h-4 w-2/5 rounded-xs" />
        <Skeleton className="h-3 w-3/5 rounded-xs" />
      </View>
    </View>
  );
}

export function SkeletonClientRow() {
  return (
    <View className="flex-row items-center gap-3 py-[14px] border-b-[0.5px] border-separator">
      <Skeleton className="w-[44px] h-[44px] rounded-full" />
      <View className="flex-1 gap-2">
        <Skeleton className="h-4 w-1/3 rounded-xs" />
        <Skeleton className="h-3 w-1/2 rounded-xs" />
      </View>
    </View>
  );
}
