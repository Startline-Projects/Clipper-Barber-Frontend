import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import { useToastStore, type Toast as ToastModel, type ToastType } from '@/lib/stores/toast';

interface IconSpec {
  name: 'check' | 'alert' | 'bell';
  bg: string;
  fg: string;
}

function iconFor(type: ToastType, colors: ReturnType<typeof useColors>): IconSpec {
  if (type === 'success') return { name: 'check', bg: colors.green + '22', fg: colors.green };
  if (type === 'error') return { name: 'alert', bg: colors.red + '22', fg: colors.red };
  return { name: 'bell', bg: colors.blue + '22', fg: colors.blue };
}

function ToastItem({ toast }: { toast: ToastModel }) {
  const colors = useColors();
  const dismiss = useToastStore((s) => s.dismiss);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const spec = iconFor(toast.type, colors);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -12,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => dismiss(toast.id));
    }, toast.duration);

    return () => clearTimeout(timeout);
  }, [toast.id, toast.duration, opacity, translateY, dismiss]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
      }}
      className="flex-row items-center gap-3 px-4 py-3 rounded-xl mb-2 mx-4 border border-separator"
    >
      <View
        style={{ backgroundColor: spec.bg }}
        className="w-8 h-8 rounded-full items-center justify-center shrink-0"
      >
        <Icon name={spec.name} size={16} color={spec.fg} />
      </View>
      <Text className="flex-1 text-md text-ink tracking-[-0.1px]" numberOfLines={3}>
        {toast.message}
      </Text>
      <Pressable
        onPress={() => dismiss(toast.id)}
        accessibilityLabel="Dismiss"
        accessibilityRole="button"
        hitSlop={10}
      >
        <Icon name="close" size={14} color={colors.tertiary} />
      </Pressable>
    </Animated.View>
  );
}

export default function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, zIndex: 9999 }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </View>
  );
}
