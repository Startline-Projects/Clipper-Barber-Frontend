import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

interface SectionProps {
  title?: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
  className?: string;
}

export default function Section({
  title,
  action,
  onAction,
  children,
  className,
}: SectionProps) {
  return (
    <View className={`mb-xl ${className ?? ''}`}>
      {title && (
        <View className="flex-row justify-between items-baseline mb-sm px-[2px]">
          <Text className="text-[20px] font-bold text-ink tracking-[-0.4px]">
            {title}
          </Text>
          {action && (
            <Pressable onPress={onAction} hitSlop={8}>
              <Text className="text-blue text-[14px] font-semibold tracking-[-0.1px]">
                {action}
              </Text>
            </Pressable>
          )}
        </View>
      )}
      {children}
    </View>
  );
}
