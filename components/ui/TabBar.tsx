import { Pressable, Text, View } from 'react-native';
import { useColors } from '@/lib/theme/colors';

interface TabBarProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export default function TabBar({ tabs, active, onChange }: TabBarProps) {
  const colors = useColors();

  return (
    <View className="flex-row gap-1 bg-bg rounded-sm p-[3px] mb-lg">
      {tabs.map((tab) => {
        const isActive = active === tab;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            style={isActive ? {
              backgroundColor: colors.surface,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowOffset: { width: 0, height: 1 },
              shadowRadius: 3,
              elevation: 1,
            } : undefined}
            className="flex-1 py-2 rounded-xs items-center"
          >
            <Text
              style={{ color: isActive ? colors.ink : colors.tertiary }}
              className="text-base font-semibold tracking-[-0.1px]"
            >
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
