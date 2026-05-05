import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from './Icon';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}

export default function Header({ title, subtitle, onBack, right }: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between pt-[6px] pb-4 min-h-[44px]">
      <View className="flex-row items-center gap-1 flex-1">
        {onBack && (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            className="pr-[2px] py-1"
          >
            <Icon name="back" size={24} />
          </Pressable>
        )}
        <View className="flex-1">
          <Text
            className={`font-extrabold text-ink tracking-[-0.6px] ${
              onBack ? 'text-2xl' : 'text-[30px]'
            }`}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text className="text-base text-tertiary mt-[1px] tracking-[-0.1px]">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {right}
    </View>
  );
}
