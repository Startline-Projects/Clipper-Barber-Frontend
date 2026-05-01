import { Text, View } from 'react-native';
import Icon, { type IconName } from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const colors = useColors();

  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-[56px] h-[56px] rounded-full bg-bg items-center justify-center mb-4">
        <Icon name={icon} size={26} color={colors.tertiary} />
      </View>
      <Text className="text-[16px] font-semibold text-ink tracking-[-0.2px] text-center mb-1">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-[14px] text-tertiary text-center leading-[20px]">
          {subtitle}
        </Text>
      )}
    </View>
  );
}
