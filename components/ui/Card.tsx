import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  className?: string;
}

export default function Card({
  children,
  onPress,
  elevated,
  className,
}: CardProps) {
  const base = `bg-card rounded-lg p-4 mb-sm ${
    elevated
      ? 'shadow-sm shadow-black/6'
      : 'border border-separator'
  } ${className ?? ''}`;

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${base} active:opacity-80`}>
        {children}
      </Pressable>
    );
  }

  return <View className={base}>{children}</View>;
}
