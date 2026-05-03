import { Tabs, useRouter } from 'expo-router';
import { View, Text } from 'react-native';
import Icon, { type IconName } from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';

const tabs: { name: string; title: string; icon: IconName; root: string }[] = [
  { name: 'today', title: 'Today', icon: 'home', root: '/(app)/(tabs)/today' },
  { name: 'calendar', title: 'Calendar', icon: 'calendar', root: '/(app)/(tabs)/calendar' },
  { name: 'bookings', title: 'Bookings', icon: 'bookings', root: '/(app)/(tabs)/bookings' },
  { name: 'messages', title: 'Chats', icon: 'chat', root: '/(app)/(tabs)/messages' },
  { name: 'menu', title: 'More', icon: 'more', root: '/(app)/(tabs)/menu' },
];

function TabIcon({
  icon,
  color,
  focused,
  badge,
}: {
  icon: IconName;
  color: string;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View className="items-center justify-center">
      <View className="relative">
        <Icon name={icon} size={24} color={color} strokeWidth={focused ? 2 : 1.6} />
        {badge != null && badge > 0 && (
          <View className="absolute -top-1 -right-[10px] min-w-[16px] h-4 rounded-full bg-red items-center justify-center px-1">
            <Text className="text-white text-[10px] font-bold">{badge}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const colors = useColors();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.tertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.1,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.separator,
          borderTopWidth: 0.5,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={tab.icon} color={color} focused={focused} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.replace(tab.root as any);
            },
          }}
        />
      ))}
    </Tabs>
  );
}
